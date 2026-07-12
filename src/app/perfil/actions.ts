'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession, destroyClientSession } from '@/lib/client-auth/session'
import { sendReceiptEmail } from '@/lib/email/receipt'
import { isFullName } from '@/lib/utils'

export async function updateAccountDetails(data: { name: string; email: string }): Promise<{ ok?: boolean; error?: string }> {
  const session = await getVerifiedClientSession()
  if (!session) return { error: 'Sessão expirada.' }

  const name = data.name.trim()
  const email = data.email.trim()
  if (!isFullName(name)) return { error: 'Informe nome e sobrenome.' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail inválido.' }

  const db = await createServiceClient() as any
  const { error } = await db
    .from('clients')
    .update({ name, email: email || null })
    .eq('id', session.clientId)

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/perfil/conta')
  revalidatePath('/perfil')
  revalidatePath('/conta')
  return { ok: true }
}

/**
 * LGPD deletion request: scrubs identifying fields instead of deleting the
 * row outright, so appointment/payment history (and other clients' data
 * integrity) stays intact. The whatsapp placeholder just needs to be unique
 * and never collide with a real number typed at login.
 */
export async function requestAccountDeletion(): Promise<{ ok?: boolean; error?: string }> {
  const session = await getVerifiedClientSession()
  if (!session) return { error: 'Sessão expirada.' }

  const db = await createServiceClient() as any
  const { error } = await db
    .from('clients')
    .update({
      name: 'Cliente removido',
      whatsapp: `deleted-${session.clientId}`,
      email: null,
      notes: null,
      avatar_url: null,
      consent_whatsapp: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

  if (error) return { error: 'Erro ao processar solicitação. Tente novamente.' }

  await destroyClientSession()
  redirect('/')
}

export async function submitReview(data: { appointmentId: string; rating: number; comment: string }): Promise<{ ok?: boolean; error?: string }> {
  const session = await getVerifiedClientSession()
  if (!session) return { error: 'Sessão expirada.' }
  if (data.rating < 1 || data.rating > 5) return { error: 'Nota inválida.' }

  const db = await createServiceClient() as any

  const { data: appt } = await db
    .from('appointments')
    .select('id, client_id, service_id, status')
    .eq('id', data.appointmentId)
    .maybeSingle()

  if (!appt || appt.client_id !== session.clientId) return { error: 'Agendamento não encontrado.' }
  if (appt.status !== 'completed') return { error: 'Só é possível avaliar atendimentos concluídos.' }

  const { error } = await db.from('reviews').insert({
    client_id: session.clientId,
    appointment_id: appt.id,
    service_id: appt.service_id,
    rating: data.rating,
    comment: data.comment.trim() || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Você já avaliou este atendimento.' }
    return { error: 'Erro ao enviar avaliação. Tente novamente.' }
  }

  revalidatePath('/perfil/avaliacoes')
  return { ok: true }
}

export async function sendReceiptByEmail(data: { paymentId: string; email: string }): Promise<{ ok?: boolean; error?: string }> {
  const session = await getVerifiedClientSession()
  if (!session) return { error: 'Sessão expirada.' }

  const email = data.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail inválido.' }

  const db = await createServiceClient() as any

  const { data: payment } = await db
    .from('payments')
    .select('id, receipt_number, method, gross_amount, fee_amount, net_amount, paid_at, appointment_id, appointments(client_id, total_price, discount, services(name), time_slots(date, start_time), clients(name, whatsapp))')
    .eq('id', data.paymentId)
    .maybeSingle()

  const appt = payment ? (Array.isArray(payment.appointments) ? payment.appointments[0] : payment.appointments) : null
  if (!payment || !appt || appt.client_id !== session.clientId) return { error: 'Pagamento não encontrado.' }

  // Keep the client's email on file if they didn't have one yet.
  await db.from('clients').update({ email }).eq('id', session.clientId).is('email', null)

  const client = Array.isArray(appt.clients) ? appt.clients[0] : appt.clients
  const service = Array.isArray(appt.services) ? appt.services[0] : appt.services
  const slot = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots

  await sendReceiptEmail({
    toEmail: email,
    clientName: client?.name ?? '',
    clientWhatsapp: client?.whatsapp ?? '',
    receiptNumber: payment.receipt_number,
    paymentId: payment.id,
    serviceName: service?.name ?? '',
    serviceDate: slot?.date ?? '',
    serviceTime: (slot?.start_time ?? '').slice(0, 5),
    subtotal: Number(appt.total_price) + Number(appt.discount ?? 0),
    discount: Number(appt.discount ?? 0),
    fee: Number(payment.fee_amount ?? 0),
    total: Number(payment.gross_amount),
    method: payment.method,
    paidAt: payment.paid_at,
  })

  return { ok: true }
}
