import { test, expect } from '@playwright/test'
import { testDb, cleanupE2EClient, E2E_MARKER } from './helpers/supabase'

// Unique per run so repeated executions (or a previous run whose cleanup
// failed) never collide on the clients.whatsapp unique constraint. `phone`
// (what gets typed into the masked input) and `whatsapp` (the E.164 form
// stored in the DB, via formatWhatsApp) must derive from the same digits.
const localNumber = `9${String(Date.now()).slice(-8)}`
const phone = `(11) ${localNumber.slice(0, 5)}-${localNumber.slice(5)}`
const whatsapp = `+5511${localNumber}`

test.describe('agendamento público — fluxo crítico', () => {
  test.afterEach(async () => {
    await cleanupE2EClient(whatsapp)
  })

  test('cliente consegue completar um agendamento do início ao fim', async ({ page }) => {
    await page.goto('/agendar')

    // Etapa 1 — escolher serviço (regex evita colidir com "Cabelo e Barba")
    await page.getByRole('button', { name: 'Cabelo 1h R$ 70' }).click()
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()

    // Etapa 2 — complementos (pular)
    await page.getByRole('button', { name: 'Continuar sem complementos' }).click()

    // Etapa 3 — data/horário (usa o atalho de horário mais próximo)
    await page.getByRole('button', { name: /Horário mais próximo/ }).click()

    // Etapa 4 — dados do cliente
    await page.getByPlaceholder('Nome e sobrenome').fill(`${E2E_MARKER} Playwright`)
    await page.getByPlaceholder('(00) 00000-0000').fill(phone)
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()

    // Etapa 5 — revisão e confirmação
    await expect(page.getByText('Confirme seu horário')).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

    // Tela de sucesso
    await expect(page.getByText('Agendamento confirmado')).toBeVisible({ timeout: 10_000 })

    // Validação de ponta a ponta: o agendamento realmente existe no banco,
    // vinculado ao cliente certo, com um slot marcado como reservado.
    const { data: client } = await testDb.from('clients').select('id, name').eq('whatsapp', whatsapp).single()
    expect(client?.name).toBe(`${E2E_MARKER} Playwright`)

    const { data: appt } = await testDb
      .from('appointments')
      .select('id, status, reference_code, time_slots(status)')
      .eq('client_id', client!.id)
      .single()
    expect(appt?.reference_code).toMatch(/^AE-/)
    expect(['pending', 'confirmed']).toContain(appt?.status)

    const slot = Array.isArray(appt?.time_slots) ? appt.time_slots[0] : appt?.time_slots
    expect(slot?.status).toBe('booked')
  })
})
