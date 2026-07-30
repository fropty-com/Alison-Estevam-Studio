import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { PrintButton } from '@/components/admin/PrintButton'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const REPORT_TITLES: Record<string, string> = {
  faturamento: 'Relatório de Faturamento',
  clientes: 'Relatório de Clientes',
  agendamentos: 'Relatório de Agendamentos',
  despesas: 'Relatório de Despesas',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', checked_in: 'Chegou',
  in_progress: 'Em atendimento', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'No-show',
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function loadFaturamento(db: any) {
  const now = new Date()
  const monthStartISO = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`
  const { data } = await db
    .from('payments')
    .select('paid_at, method, gross_amount, fee_amount, tip_amount, net_amount, appointments(reference_code, clients(name), services(name))')
    .gte('paid_at', monthStartISO)
    .lt('paid_at', nextMonthISO)
    .order('paid_at', { ascending: true })

  const headers = ['Data', 'Cliente', 'Serviço', 'Forma', 'Bruto', 'Taxa', 'Gorjeta', 'Líquido']
  const rows = ((data ?? []) as any[]).map(p => {
    const appt = Array.isArray(p.appointments) ? p.appointments[0] : p.appointments
    const client = Array.isArray(appt?.clients) ? appt.clients[0] : appt?.clients
    const service = Array.isArray(appt?.services) ? appt.services[0] : appt?.services
    return [
      format(new Date(p.paid_at), 'dd/MM HH:mm'),
      client?.name ?? '',
      service?.name ?? '',
      p.method,
      fmt(Number(p.gross_amount ?? 0)),
      fmt(Number(p.fee_amount ?? 0)),
      fmt(Number(p.tip_amount ?? 0)),
      fmt(Number(p.net_amount ?? 0)),
    ]
  })
  return { headers, rows }
}

async function loadClientes(db: any) {
  const [clientsRes, completedRes] = await Promise.all([
    db.from('clients').select('id, name, whatsapp, vip').order('name', { ascending: true }),
    db.from('appointments').select('client_id, total_price, time_slots!inner(date)').eq('status', 'completed'),
  ])
  const clients = (clientsRes.data ?? []) as any[]
  const completed = (completedRes.data ?? []) as any[]
  const stats: Record<string, { count: number; total: number }> = {}
  for (const a of completed) {
    if (!a.client_id) continue
    const s = (stats[a.client_id] ??= { count: 0, total: 0 })
    s.count++
    s.total += Number(a.total_price ?? 0)
  }
  const headers = ['Nome', 'WhatsApp', 'VIP', 'Visitas', 'Ticket médio']
  const rows = clients.map(c => {
    const s = stats[c.id]
    return [c.name, c.whatsapp ?? '', c.vip ? 'Sim' : 'Não', s?.count ?? 0, fmt(s ? s.total / s.count : 0)]
  })
  return { headers, rows }
}

async function loadAgendamentos(db: any) {
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const { data } = await db
    .from('appointments')
    .select('status, total_price, clients(name), services(name), time_slots!inner(date, start_time)')
    .gte('time_slots.date', monthStart)
    .lte('time_slots.date', monthEnd)
    .order('time_slots(date)', { ascending: true })

  const headers = ['Data', 'Hora', 'Cliente', 'Serviço', 'Status', 'Valor']
  const rows = ((data ?? []) as any[]).map(a => {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
    const service = Array.isArray(a.services) ? a.services[0] : a.services
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    return [
      slot?.date ? format(new Date(`${slot.date}T00:00:00`), 'dd/MM') : '',
      (slot?.start_time ?? '').slice(0, 5),
      client?.name ?? '',
      service?.name ?? '',
      STATUS_LABEL[a.status] ?? a.status,
      fmt(Number(a.total_price ?? 0)),
    ]
  })
  return { headers, rows }
}

async function loadDespesas(db: any) {
  const { data } = await db
    .from('expenses')
    .select('description, category, amount, is_fixed, due_date, paid_date')
    .order('due_date', { ascending: false })
    .limit(500)

  const headers = ['Descrição', 'Categoria', 'Tipo', 'Valor', 'Vencimento', 'Pagamento']
  const rows = ((data ?? []) as any[]).map(e => [
    e.description,
    e.category,
    e.is_fixed ? 'Fixa' : 'Variável',
    fmt(Number(e.amount ?? 0)),
    format(new Date(`${e.due_date}T00:00:00`), 'dd/MM/yyyy'),
    e.paid_date ? format(new Date(`${e.paid_date}T00:00:00`), 'dd/MM/yyyy') : 'Não paga',
  ])
  return { headers, rows }
}

export default async function ImprimirRelatorioPage({ params }: { params: { tipo: string } }) {
  const title = REPORT_TITLES[params.tipo]
  if (!title) notFound()

  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient() as any

  const { headers, rows } =
    params.tipo === 'faturamento'   ? await loadFaturamento(db)   :
    params.tipo === 'clientes'      ? await loadClientes(db)      :
    params.tipo === 'agendamentos'  ? await loadAgendamentos(db)  :
    await loadDespesas(db)

  const generatedAt = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })

  return (
    <div className="px-6 py-8 print:bg-white print:text-black print:px-0 print:py-0">
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] print:text-black/50 mb-1">
            Alison Estevam Studio
          </p>
          <h1 className="font-display font-light text-[26px] text-offwhite print:text-black tracking-[0.02em]">{title}</h1>
          <p className="font-body font-light text-[9px] text-offwhite/30 print:text-black/50 tracking-[0.1em] mt-1">
            Gerado em {generatedAt}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="overflow-x-auto border border-offwhite/[0.1] print:border-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-offwhite/[0.1] print:border-black/20">
              {headers.map(h => (
                <th key={h} className="px-3 py-2 font-body font-light text-[8px] tracking-[0.15em] uppercase text-offwhite/40 print:text-black/60 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-3 py-6 text-center font-body font-light text-[11px] text-offwhite/[0.22] print:text-black/40 italic">
                  Nenhum dado encontrado.
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="border-b border-offwhite/[0.05] print:border-black/10">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-[7px] font-body font-light text-[11px] text-offwhite/75 print:text-black whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
