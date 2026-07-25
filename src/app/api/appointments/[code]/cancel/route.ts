import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canCancelAppointment } from '@/lib/utils'
import { BOOKING } from '@/config/booking'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const allowed = await checkRateLimit(`cancel:${getClientIp(request)}`, 600, 15)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  const db = await createServiceClient() as any

  const body = await request.json().catch(() => ({}))
  const reason = (body?.reason as string | undefined) || null

  const { data: appt, error } = await db
    .from('appointments')
    .select('id, status, slot_id, time_slots(date, start_time)')
    .eq('reference_code', params.code.toUpperCase())
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  if (appt.status === 'cancelled') {
    return NextResponse.json({ error: 'Este agendamento já está cancelado.' }, { status: 409 })
  }

  // Allowlist, not a blocklist: only appointments that haven't started yet
  // can be cancelled through the public link. Once the client has checked
  // in (or is already being attended, or it's done/no-show), cancelling
  // makes no sense and must go through the admin panel instead.
  if (!['pending', 'confirmed'].includes(appt.status)) {
    return NextResponse.json({ error: 'Este agendamento não pode ser cancelado.' }, { status: 409 })
  }

  // This route is the public, client-facing cancel flow only — the admin
  // panel cancels through its own Server Action, unaffected by this window.
  // The UI already computed this client-side to hide/show the button, but
  // that's advisory only; the authoritative check has to happen here too.
  const slot = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots
  if (slot && !canCancelAppointment(slot.date, slot.start_time.substring(0, 5))) {
    return NextResponse.json(
      { error: `Cancelamentos só podem ser feitos com pelo menos ${BOOKING.cancellationWindowHours}h de antecedência. Entre em contato pelo WhatsApp.` },
      { status: 409 }
    )
  }

  await Promise.all([
    db.from('appointments').update({
      status:               'cancelled',
      cancelled_at:         new Date().toISOString(),
      cancellation_reason:  reason,
      updated_at:           new Date().toISOString(),
    }).eq('id', appt.id),
    db.from('time_slots').update({ status: 'available' }).eq('id', appt.slot_id),
  ])

  return NextResponse.json({ ok: true })
}
