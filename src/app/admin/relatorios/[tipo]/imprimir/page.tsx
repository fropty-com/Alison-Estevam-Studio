import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { PrintButton } from '@/components/admin/PrintButton'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'

export const dynamic = 'force-dynamic'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type ReportDb = Awaited<ReturnType<typeof createServiceClient>>
type ReportDictionary = ReturnType<typeof getDictionary>

async function loadFaturamento(db: ReportDb, t: ReportDictionary) {
  const now = new Date()
  const monthStartISO = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`
  const { data } = await db
    .from('payments')
    .select('paid_at, method, gross_amount, fee_amount, tip_amount, net_amount, appointments(reference_code, clients(name), services(name))')
    .gte('paid_at', monthStartISO)
    .lt('paid_at', nextMonthISO)
    .order('paid_at', { ascending: true })

  const c = t.reports.print.columns
  const headers = [c.date, c.client, c.service, c.method, c.gross, c.fee, c.tip, c.net]
  const rows = (data ?? []).map(p => {
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

async function loadClientes(db: ReportDb, t: ReportDictionary) {
  const [clientsRes, completedRes] = await Promise.all([
    db.from('clients').select('id, name, whatsapp, vip').order('name', { ascending: true }),
    db.from('appointments').select('client_id, total_price, time_slots!inner(date)').eq('status', 'completed'),
  ])
  const clients = clientsRes.data ?? []
  const completed = completedRes.data ?? []
  const stats: Record<string, { count: number; total: number }> = {}
  for (const a of completed) {
    if (!a.client_id) continue
    const s = (stats[a.client_id] ??= { count: 0, total: 0 })
    s.count++
    s.total += Number(a.total_price ?? 0)
  }
  const c = t.reports.print.columns
  const headers = [c.name, c.whatsapp, c.vip, c.visits, c.avgTicket]
  const rows = clients.map(cl => {
    const s = stats[cl.id]
    return [cl.name, cl.whatsapp ?? '', cl.vip ? c.yes : c.no, s?.count ?? 0, fmt(s ? s.total / s.count : 0)]
  })
  return { headers, rows }
}

async function loadAgendamentos(db: ReportDb, t: ReportDictionary) {
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const { data } = await db
    .from('appointments')
    .select('status, total_price, clients(name), services(name), time_slots!inner(date, start_time)')
    .gte('time_slots.date', monthStart)
    .lte('time_slots.date', monthEnd)
    .order('time_slots(date)', { ascending: true })

  const c = t.reports.print.columns
  const headers = [c.date, c.time, c.client, c.service, c.status, c.value]
  const rows = (data ?? []).map(a => {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
    const service = Array.isArray(a.services) ? a.services[0] : a.services
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    return [
      slot?.date ? format(new Date(`${slot.date}T00:00:00`), 'dd/MM') : '',
      (slot?.start_time ?? '').slice(0, 5),
      client?.name ?? '',
      service?.name ?? '',
      t.dashboard.status[a.status as keyof typeof t.dashboard.status] ?? a.status,
      fmt(Number(a.total_price ?? 0)),
    ]
  })
  return { headers, rows }
}

async function loadDespesas(db: ReportDb, t: ReportDictionary) {
  const { data } = await db
    .from('expenses')
    .select('description, category, amount, is_fixed, due_date, paid_date')
    .order('due_date', { ascending: false })
    .limit(500)

  const c = t.reports.print.columns
  const headers = [c.description, c.category, c.type, c.value, c.dueDate, c.paidDate]
  const rows = (data ?? []).map(e => [
    e.description,
    e.category,
    e.is_fixed ? c.fixed : c.variable,
    fmt(Number(e.amount ?? 0)),
    format(new Date(`${e.due_date}T00:00:00`), 'dd/MM/yyyy'),
    e.paid_date ? format(new Date(`${e.paid_date}T00:00:00`), 'dd/MM/yyyy') : c.notPaid,
  ])
  return { headers, rows }
}

export default async function ImprimirRelatorioPage({ params }: { params: { tipo: string } }) {
  const locale = await getLocale()
  const t = getDictionary(locale)

  const title = t.reports.print.titles[params.tipo as keyof typeof t.reports.print.titles]
  if (!title) notFound()

  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient()

  const { headers, rows } =
    params.tipo === 'faturamento'   ? await loadFaturamento(db, t)   :
    params.tipo === 'clientes'      ? await loadClientes(db, t)      :
    params.tipo === 'agendamentos'  ? await loadAgendamentos(db, t)  :
    await loadDespesas(db, t)

  const generatedAt = format(new Date(), locale === 'pt' ? "d 'de' MMMM 'de' yyyy, HH:mm" : 'MMMM d, yyyy, HH:mm', { locale: DATE_FNS_LOCALE[locale] })

  return (
    <div className="px-6 py-8 print:bg-white print:text-black print:px-0 print:py-0">
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/55 print:text-black/50 mb-1">
            Alison Estevam Studio
          </p>
          <h1 className="font-display font-light text-[26px] text-offwhite print:text-black tracking-[0.02em]">{title}</h1>
          <p className="font-body font-light text-[9px] text-offwhite/55 print:text-black/50 tracking-[0.1em] mt-1">
            {t.reports.print.generatedAt(generatedAt)}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="overflow-x-auto border border-offwhite/[0.1] print:border-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-offwhite/[0.1] print:border-black/20">
              {headers.map(h => (
                <th key={h} className="px-3 py-2 font-body font-light text-[8px] tracking-[0.15em] uppercase text-offwhite/55 print:text-black/60 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-3 py-6 text-center font-body font-light text-[11px] text-offwhite/55 print:text-black/40 italic">
                  {t.reports.print.noData}
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
