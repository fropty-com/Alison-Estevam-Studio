import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const allowed = await checkRateLimit(`reschedule:${getClientIp(request)}`, 600, 15)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  const db = await createServiceClient() as any

  const body = await request.json().catch(() => ({}))
  const { newSlotId } = body as { newSlotId?: string }

  if (!newSlotId) {
    return NextResponse.json({ error: 'Horário não informado.' }, { status: 422 })
  }

  const { data: appt, error } = await db
    .from('appointments')
    .select('id, status, slot_id')
    .eq('reference_code', params.code.toUpperCase())
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  // Allowlist, not a blocklist — see cancel/route.ts for why. A checked-in
  // or in-progress appointment can't be moved to a different slot either.
  if (!['pending', 'confirmed'].includes(appt.status)) {
    return NextResponse.json({ error: 'Este agendamento não pode ser reagendado.' }, { status: 409 })
  }

  // Atomically claim the new slot — condition the UPDATE on it still being
  // 'available' so two concurrent reschedules can't both land on it (a plain
  // SELECT-then-UPDATE has a window where both requests pass the check).
  const { data: claimedSlot } = await db
    .from('time_slots')
    .update({ status: 'booked' })
    .eq('id', newSlotId)
    .eq('status', 'available')
    .select('id, date, start_time')
    .maybeSingle()

  if (!claimedSlot) {
    return NextResponse.json({ error: 'Este horário não está mais disponível.' }, { status: 409 })
  }
  const newSlot = claimedSlot

  await Promise.all([
    db.from('appointments').update({
      slot_id:    newSlotId,
      status:     'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', appt.id),
    db.from('time_slots').update({ status: 'available' }).eq('id', appt.slot_id),
  ])

  return NextResponse.json({
    ok:        true,
    date:      newSlot.date,
    startTime: (newSlot.start_time as string).substring(0, 5),
  })
}
