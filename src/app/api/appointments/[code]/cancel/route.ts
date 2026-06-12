import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const db = await createServiceClient() as any

  const body = await request.json().catch(() => ({}))
  const reason = (body?.reason as string | undefined) || null

  const { data: appt, error } = await db
    .from('appointments')
    .select('id, status, slot_id')
    .eq('reference_code', params.code.toUpperCase())
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  if (appt.status === 'cancelled') {
    return NextResponse.json({ error: 'Este agendamento já está cancelado.' }, { status: 409 })
  }

  if (appt.status === 'completed' || appt.status === 'no_show') {
    return NextResponse.json({ error: 'Este agendamento não pode ser cancelado.' }, { status: 409 })
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
