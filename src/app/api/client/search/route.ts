import { NextRequest, NextResponse } from 'next/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'

/**
 * Search scoped to the logged-in client's own appointments, by date or
 * service name — never other clients' data. Matched client-side (not via
 * PostgREST .ilike on embedded columns) since a client's appointment count
 * is small and the match needs to cover both the raw date and its
 * formatted/month-name forms.
 */
export async function GET(request: NextRequest) {
  const session = await getVerifiedClientSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const qRaw = request.nextUrl.searchParams.get('q')?.trim().toLowerCase()
  if (!qRaw || qRaw.length < 2) return NextResponse.json({ appointments: [] })

  const db = await createServiceClient()
  const { data } = await db
    .from('appointments')
    .select('id, reference_code, status, services(name), time_slots(date, start_time), payments(id)')
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []).map(a => {
    const svc = Array.isArray(a.services) ? a.services[0] : a.services
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    const payment = Array.isArray(a.payments) ? a.payments[0] : a.payments
    return {
      id: a.id as string,
      referenceCode: a.reference_code as string,
      status: a.status as string,
      serviceName: svc?.name ?? '—',
      date: slot?.date as string | undefined,
      startTime: slot?.start_time ? (slot.start_time as string).substring(0, 5) : undefined,
      paymentId: payment?.id as string | undefined,
    }
  })

  const matches = rows.filter(r => {
    if (r.serviceName.toLowerCase().includes(qRaw)) return true
    if (!r.date) return false
    const iso = r.date
    const br = format(parseISO(r.date), 'dd/MM/yyyy')
    const month = format(parseISO(r.date), 'MMMM', { locale: ptBR }).toLowerCase()
    return iso.includes(qRaw) || br.includes(qRaw) || month.includes(qRaw)
  }).slice(0, 8)

  return NextResponse.json({ appointments: matches })
}
