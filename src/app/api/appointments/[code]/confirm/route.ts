import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const allowed = await checkRateLimit(`confirm:${getClientIp(request)}`, 600, 15)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  const db = await createServiceClient() as any

  const { data: appt, error } = await db
    .from('appointments')
    .select('id, status')
    .eq('reference_code', params.code.toUpperCase())
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  if (appt.status === 'confirmed') {
    return NextResponse.json({ ok: true, alreadyConfirmed: true })
  }

  // Only a still-pending appointment can be confirmed through this public
  // link — confirming a checked-in/in-progress one would downgrade its
  // status backwards, and completed/cancelled/no_show obviously don't apply.
  if (appt.status !== 'pending') {
    return NextResponse.json({ error: 'Este agendamento não pode ser confirmado.' }, { status: 409 })
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
