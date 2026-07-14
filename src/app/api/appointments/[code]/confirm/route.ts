import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const db = await createServiceClient() as any

  const { data: appt, error } = await db
    .from('appointments')
    .select('id, status')
    .eq('reference_code', params.code.toUpperCase())
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  if (['cancelled', 'completed', 'no_show'].includes(appt.status)) {
    return NextResponse.json({ error: 'Este agendamento não pode ser confirmado.' }, { status: 409 })
  }

  if (appt.status === 'confirmed') {
    return NextResponse.json({ ok: true, alreadyConfirmed: true })
  }

  const { error: updateError } = await db
    .from('appointments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', appt.id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao confirmar presença. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
