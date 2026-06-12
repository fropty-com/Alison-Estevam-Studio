import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
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

  if (['cancelled', 'completed', 'no_show'].includes(appt.status)) {
    return NextResponse.json({ error: 'Este agendamento não pode ser reagendado.' }, { status: 409 })
  }

  const { data: newSlot } = await db
    .from('time_slots')
    .select('id, date, start_time, status')
    .eq('id', newSlotId)
    .eq('status', 'available')
    .single()

  if (!newSlot) {
    return NextResponse.json({ error: 'Este horário não está mais disponível.' }, { status: 409 })
  }

  await Promise.all([
    db.from('appointments').update({
      slot_id:    newSlotId,
      status:     'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', appt.id),
    db.from('time_slots').update({ status: 'available' }).eq('id', appt.slot_id),
    db.from('time_slots').update({ status: 'booked'    }).eq('id', newSlotId),
  ])

  return NextResponse.json({
    ok:        true,
    date:      newSlot.date,
    startTime: (newSlot.start_time as string).substring(0, 5),
  })
}
