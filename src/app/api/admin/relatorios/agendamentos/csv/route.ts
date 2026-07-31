import { createServiceClient } from '@/lib/supabase/server'
import { getAdminRole } from '@/lib/admin-auth'
import { toCsv, csvResponse } from '@/lib/csv'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  checked_in: 'Chegou',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'No-show',
}

export async function GET() {
  const role = await getAdminRole()
  if (role !== 'owner') return new Response('Não autorizado.', { status: 403 })

  const db = await createServiceClient()
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data } = await db
    .from('appointments')
    .select('reference_code, status, total_price, discount, clients(name, whatsapp), services(name), time_slots!inner(date, start_time)')
    .gte('time_slots.date', monthStart)
    .lte('time_slots.date', monthEnd)
    .order('time_slots(date)', { ascending: true })

  const rows = (data ?? []).map(a => {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
    const service = Array.isArray(a.services) ? a.services[0] : a.services
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    return [
      slot?.date ? format(new Date(`${slot.date}T00:00:00`), 'dd/MM/yyyy') : '',
      (slot?.start_time ?? '').slice(0, 5),
      a.reference_code ?? '',
      client?.name ?? '',
      client?.whatsapp ?? '',
      service?.name ?? '',
      STATUS_LABEL[a.status] ?? a.status,
      Number(a.total_price ?? 0).toFixed(2),
      Number(a.discount ?? 0).toFixed(2),
    ]
  })

  const csv = toCsv(
    ['Data', 'Hora', 'Código', 'Cliente', 'WhatsApp', 'Serviço', 'Status', 'Valor', 'Desconto'],
    rows
  )

  return csvResponse(`agendamentos-${format(now, 'yyyy-MM')}.csv`, csv)
}
