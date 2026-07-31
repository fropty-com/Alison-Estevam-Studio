import { createServiceClient } from '@/lib/supabase/server'
import { getAdminRole } from '@/lib/admin-auth'
import { toCsv, csvResponse } from '@/lib/csv'
import { format } from 'date-fns'
import { todayInSaoPaulo } from '@/lib/timezone'

export async function GET() {
  const role = await getAdminRole()
  if (role !== 'owner') return new Response('Não autorizado.', { status: 403 })

  const db = await createServiceClient()

  const [clientsRes, completedRes] = await Promise.all([
    db.from('clients').select('id, name, whatsapp, email, vip, created_at').order('name', { ascending: true }),
    db.from('appointments').select('client_id, total_price, time_slots!inner(date)').eq('status', 'completed'),
  ])

  const clients = clientsRes.data ?? []
  const completed = completedRes.data ?? []

  const statsByClient: Record<string, { count: number; total: number; lastDate: string }> = {}
  for (const a of completed) {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    if (!a.client_id || !slot?.date) continue
    const s = (statsByClient[a.client_id] ??= { count: 0, total: 0, lastDate: '' })
    s.count++
    s.total += Number(a.total_price ?? 0)
    if (slot.date > s.lastDate) s.lastDate = slot.date
  }

  const rows = clients.map(c => {
    const s = statsByClient[c.id]
    return [
      c.name,
      c.whatsapp ?? '',
      c.email ?? '',
      c.vip ? 'Sim' : 'Não',
      format(new Date(c.created_at), 'dd/MM/yyyy'),
      s?.count ?? 0,
      s ? (s.total / s.count).toFixed(2) : '0.00',
      s?.lastDate ? format(new Date(`${s.lastDate}T00:00:00`), 'dd/MM/yyyy') : '',
    ]
  })

  const csv = toCsv(
    ['Nome', 'WhatsApp', 'E-mail', 'VIP', 'Cliente desde', 'Total de visitas', 'Ticket médio', 'Última visita'],
    rows
  )

  return csvResponse(`clientes-${todayInSaoPaulo()}.csv`, csv)
}
