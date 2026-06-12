import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const db = await createServiceClient() as any

  const { data, error } = await db
    .from('appointments')
    .select('id, reference_code, status, clients(name, whatsapp), services(name, price, duration), time_slots(date, start_time)')
    .eq('reference_code', params.code.toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
