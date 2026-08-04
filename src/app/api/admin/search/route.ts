import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/admin-auth'

// Not covered by middleware (matcher is /admin/:path*, not /api/admin/:path*)
// and returns client PII, so it needs its own auth check.
export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const qRaw = request.nextUrl.searchParams.get('q')?.trim()
  if (!qRaw || qRaw.length < 2) return NextResponse.json({ clients: [], appointments: [] })

  // ',', '(', ')' are syntax in PostgREST's .or() mini-language (condition
  // separator / grouping) — interpolating user input unescaped lets it
  // inject extra filter conditions. Strip them; none are legitimate here.
  const q = qRaw.replace(/[,()]/g, '')
  if (q.length < 2) return NextResponse.json({ clients: [], appointments: [] })

  const db = await createServiceClient()

  const [clientsRes, appointmentsRes] = await Promise.all([
    db
      .from('clients')
      .select('id, name, whatsapp, email, avatar_url')
      .or(`name.ilike.%${q}%,whatsapp.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5),
    db
      .from('appointments')
      .select('id, reference_code, status, clients(name), services(name), time_slots(date, start_time)')
      .ilike('reference_code', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const appointments = (appointmentsRes.data ?? []).map(a => {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
    const service = Array.isArray(a.services) ? a.services[0] : a.services
    return {
      id: a.id,
      referenceCode: a.reference_code as string,
      status: a.status as string,
      clientName: client?.name ?? 'Cliente',
      serviceName: service?.name ?? 'Serviço',
      date: slot?.date as string | undefined,
    }
  })

  return NextResponse.json({ clients: clientsRes.data ?? [], appointments })
}
