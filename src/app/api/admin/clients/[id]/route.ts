import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getLoyaltyProgress } from '@/lib/loyalty'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const db = await createServiceClient()

  const [clientRes, apptsRes, loyalty] = await Promise.all([
    db.from('clients').select('*').eq('id', params.id).single(),
    db.from('appointments')
      .select('id, reference_code, status, created_at, services(name, price), time_slots(date, start_time), payments(id, net_amount, refunded_at)')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false }),
    getLoyaltyProgress(db, params.id),
  ])

  if (!clientRes.data) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

  const client = clientRes.data
  const appts = apptsRes.data ?? []

  const history = appts.map(a => {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
    const payment = Array.isArray(a.payments) ? a.payments[0] : a.payments
    return {
      id: a.id,
      status: a.status,
      date: slot?.date ?? null,
      startTime: slot?.start_time ? String(slot.start_time).slice(0, 5) : null,
      serviceName: svc?.name ?? '—',
      servicePrice: svc?.price ?? null,
      paymentId: payment?.id ?? null,
      paymentNetAmount: payment?.net_amount ?? null,
      paymentRefundedAt: payment?.refunded_at ?? null,
    }
  })

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      whatsapp: client.whatsapp,
      email: client.email,
      birthDate: client.birth_date,
      vip: client.vip,
      notes: client.notes,
      createdAt: client.created_at,
    },
    history,
    loyalty,
  })
}
