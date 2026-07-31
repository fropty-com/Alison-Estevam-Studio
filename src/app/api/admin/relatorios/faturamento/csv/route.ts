import { createServiceClient } from '@/lib/supabase/server'
import { getAdminRole } from '@/lib/admin-auth'
import { toCsv, csvResponse } from '@/lib/csv'
import { format, startOfMonth, addMonths } from 'date-fns'
import { nowAnchorInSaoPaulo, dateAnchorInSaoPaulo, formatTimeInSaoPaulo, monthKeyInSaoPaulo } from '@/lib/timezone'

export async function GET() {
  const role = await getAdminRole()
  if (role !== 'owner') return new Response('Não autorizado.', { status: 403 })

  const db = await createServiceClient()
  const now = nowAnchorInSaoPaulo()
  const monthStartISO = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd')}T00:00:00`

  const { data } = await db
    .from('payments')
    .select('paid_at, method, gross_amount, fee_amount, tip_amount, net_amount, appointments(reference_code, discount, clients(name), services(name))')
    .gte('paid_at', monthStartISO)
    .lt('paid_at', nextMonthISO)
    .is('refunded_at', null)
    .order('paid_at', { ascending: true })

  const rows = (data ?? []).map(p => {
    const appt = Array.isArray(p.appointments) ? p.appointments[0] : p.appointments
    const client = Array.isArray(appt?.clients) ? appt.clients[0] : appt?.clients
    const service = Array.isArray(appt?.services) ? appt.services[0] : appt?.services
    return [
      `${format(dateAnchorInSaoPaulo(new Date(p.paid_at)), 'dd/MM/yyyy')} ${formatTimeInSaoPaulo(new Date(p.paid_at))}`,
      appt?.reference_code ?? '',
      client?.name ?? '',
      service?.name ?? '',
      p.method,
      Number(p.gross_amount ?? 0).toFixed(2),
      Number(appt?.discount ?? 0).toFixed(2),
      Number(p.fee_amount ?? 0).toFixed(2),
      Number(p.tip_amount ?? 0).toFixed(2),
      Number(p.net_amount ?? 0).toFixed(2),
    ]
  })

  const csv = toCsv(
    ['Data', 'Código', 'Cliente', 'Serviço', 'Forma de pagamento', 'Valor bruto', 'Desconto', 'Taxa', 'Gorjeta', 'Valor líquido'],
    rows
  )

  return csvResponse(`faturamento-${monthKeyInSaoPaulo(now)}.csv`, csv)
}
