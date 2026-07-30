import { test, expect } from '@playwright/test'
import { testDb, cleanupE2EClient, E2E_MARKER } from './helpers/supabase'

const localNumber = `9${String(Date.now()).slice(-8)}`
const whatsapp = `+5511${localNumber}`
const CABELO_SERVICE_ID = 'da6695a3-8a1b-49c5-a3cb-b1a772acb412'

test.describe('cancelamento público — fluxo crítico', () => {
  let referenceCode: string

  test.beforeEach(async ({ request }) => {
    // Setup via API (not the UI) — this test is about the cancellation
    // flow itself, not re-proving the booking wizard works (booking.spec.ts
    // already covers that).
    const { data: slot } = await testDb
      .from('time_slots')
      .select('id, date')
      .eq('status', 'available')
      .gt('date', new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .limit(1)
      .single()
    if (!slot) throw new Error('No available time_slots found for cancellation test setup — is the seed data stale?')

    const res = await request.post('/api/appointments', {
      data: {
        name: `${E2E_MARKER} Cancelamento`,
        whatsapp,
        serviceId: CABELO_SERVICE_ID,
        slotId: slot.id,
      },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    referenceCode = body.referenceCode
  })

  test.afterEach(async () => {
    await cleanupE2EClient(whatsapp)
  })

  test('cliente consegue cancelar um agendamento pelo link público', async ({ page }) => {
    await page.goto(`/cancelar/${referenceCode}`)

    await page.getByRole('button', { name: 'Cancelar agendamento' }).click()
    await page.getByRole('button', { name: 'Confirmar cancelamento' }).click()

    await expect(page.getByText('Agendamento cancelado.')).toBeVisible({ timeout: 10_000 })

    const { data: appt } = await testDb
      .from('appointments')
      .select('status, cancelled_at, time_slots(status)')
      .eq('reference_code', referenceCode)
      .single()
    expect(appt?.status).toBe('cancelled')
    expect(appt?.cancelled_at).not.toBeNull()

    const slot = Array.isArray(appt?.time_slots) ? appt.time_slots[0] : appt?.time_slots
    expect(slot?.status).toBe('available')
  })
})
