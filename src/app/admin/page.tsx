import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pendente',       color: 'text-warning border-warning/30 bg-warning/[0.08]'  },
  confirmed:   { label: 'Confirmado',     color: 'text-sage-light border-sage/30 bg-sage/10'     },
  checked_in:  { label: 'Chegou',         color: 'text-gold border-gold/30 bg-gold/10'           },
  in_progress: { label: 'Em atendimento', color: 'text-gold border-gold/30 bg-gold/10'           },
  completed:   { label: 'Concluído',      color: 'text-offwhite/40 border-offwhite/[0.12] bg-offwhite/5' },
  cancelled:   { label: 'Cancelado',      color: 'text-error/60 border-error/20 bg-error/5'     },
  no_show:     { label: 'No-show',        color: 'text-error/45 border-error/15 bg-error/5'     },
}

function CurrencyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M9.3 5.3c-.4-.5-1.1-.8-1.8-.8-1.2 0-2.1.8-2.1 1.8s.9 1.5 2.1 1.8c1.2.3 2.1.8 2.1 1.8s-.9 1.8-2.1 1.8c-.7 0-1.4-.3-1.8-.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="3" x2="7.5" y2="4.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="10.7" x2="7.5" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
function PersonPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="5.8" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1.5 13c0-2.6 1.9-4.3 4.3-4.3s4.3 1.7 4.3 4.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="11.5" y1="3" x2="11.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="9.5" y1="5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
function TicketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="12" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <line x1="4" y1="5.2" x2="11" y2="5.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="7.5" x2="9" y2="7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="9.8" x2="10" y2="9.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
function ScaleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <line x1="7.5" y1="2" x2="7.5" y2="12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="2.5" y1="12.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M2.5 5.5h6M2.5 5.5 1 8.5h4L2.5 5.5ZM8.5 5.5h6M8.5 5.5 7 8.5h4L8.5 5.5Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ScissorsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="4.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.1" />
      <line x1="12.5" y1="4.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="6" y1="4.5" x2="12.5" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="12" height="11" stroke="currentColor" strokeWidth="1.1" />
      <line x1="1.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="1.1" />
      <line x1="4" y1="1" x2="4" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

const CARD_TONE = {
  gold:     { badge: 'bg-gold/15 text-gold',           value: 'text-offwhite' },
  sage:     { badge: 'bg-sage/15 text-sage-light',      value: 'text-offwhite' },
  neutral:  { badge: 'bg-offwhite/10 text-offwhite/60', value: 'text-offwhite' },
}

function DashboardCard({
  icon, tone, label, value, sub, href,
}: {
  icon: React.ReactNode
  tone: keyof typeof CARD_TONE
  label: string
  value: string | number
  sub: string
  href?: string
}) {
  const t = CARD_TONE[tone]
  const content = (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-5 h-full flex flex-col hover:border-offwhite/[0.14] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className={cn('w-[36px] h-[36px] rounded-full flex items-center justify-center', t.badge)}>
          {icon}
        </span>
        {href && <span className="text-offwhite/25 text-[12px]" aria-hidden="true">↗</span>}
      </div>
      <p className={cn('font-data text-[24px] leading-none mb-1', t.value)}>{value}</p>
      <p className="font-body font-light text-[9px] tracking-[0.18em] uppercase text-offwhite/40 mt-1">{label}</p>
      <p className="font-body font-light text-[9px] text-offwhite/[0.28] mt-auto pt-2">{sub}</p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default async function AdminDashboard() {
  const db = await createServiceClient() as any

  const today       = format(new Date(), 'yyyy-MM-dd')
  const weekStart   = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd     = format(endOfWeek(new Date(), { weekStartsOn: 1 }),   'yyyy-MM-dd')
  const monthStart  = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthStartISO = `${monthStart}T00:00:00`

  const [todayRes, weekRes, clientsRes, monthPayRes, newClientsRes, openRes, activeServicesRes] = await Promise.all([
    db.from('appointments')
      .select('id, reference_code, status, services(name, price), clients(name, whatsapp), time_slots!inner(date, start_time)')
      .eq('time_slots.date', today)
      .not('status', 'in', '("cancelled","no_show")')
      .order('time_slots(start_time)', { ascending: true }),

    db.from('appointments')
      .select('id, status, time_slots!inner(date)', { count: 'exact' })
      .gte('time_slots.date', weekStart)
      .lte('time_slots.date', weekEnd)
      .not('status', 'in', '("cancelled","no_show")'),

    db.from('clients').select('id', { count: 'exact', head: true }),

    db.from('payments').select('gross_amount').gte('paid_at', monthStartISO),

    db.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', monthStartISO),

    db.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['checked_in', 'in_progress']),

    db.from('services').select('id', { count: 'exact', head: true }).eq('active', true),
  ])

  const todayAppts   = (todayRes.data   ?? []) as any[]
  const weekCount    = weekRes.count    ?? 0
  const totalClients = clientsRes.count ?? 0

  const monthPayments   = (monthPayRes.data ?? []) as any[]
  const monthRevenue    = monthPayments.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const avgTicketMonth  = monthPayments.length > 0 ? monthRevenue / monthPayments.length : 0
  const newClientsMonth = newClientsRes.count ?? 0
  const openComandas    = openRes.count ?? 0
  const activeServices  = activeServicesRes.count ?? 0

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const monthLabel = format(new Date(), 'MMMM', { locale: ptBR })

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">
          {todayLabel}
        </p>
        <h1 className="font-display font-light text-[34px] text-offwhite tracking-[0.03em]">
          Bom dia, Alison.
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <DashboardCard icon={<CalendarIcon />} tone="gold" label="Hoje" value={todayAppts.length} sub="agendamentos" href="/admin/agenda" />
        <DashboardCard icon={<CalendarIcon />} tone="neutral" label="Esta semana" value={weekCount} sub="confirmados" href="/admin/agenda?view=week" />
        <DashboardCard icon={<PersonPlusIcon />} tone="sage" label="Total clientes" value={totalClients} sub="cadastrados" href="/admin/clientes" />
        <DashboardCard icon={<PersonPlusIcon />} tone="sage" label="Clientes novos" value={newClientsMonth} sub={`em ${monthLabel}`} href="/admin/clientes" />
        <DashboardCard icon={<CurrencyIcon />} tone="gold" label="Receita do mês" value={fmt(monthRevenue)} sub={`em ${monthLabel}`} href="/admin/relatorios" />
        <DashboardCard icon={<ScaleIcon />} tone="neutral" label="Ticket médio" value={fmt(avgTicketMonth)} sub={`${monthPayments.length} pagamento${monthPayments.length !== 1 ? 's' : ''}`} href="/admin/relatorios" />
        <DashboardCard icon={<TicketIcon />} tone="gold" label="Comandas em aberto" value={openComandas} sub="aguardando check-out" href="/admin/agenda" />
        <DashboardCard icon={<ScissorsIcon />} tone="neutral" label="Serviços ativos" value={activeServices} sub="ver seção serviços" href="/admin/servicos" />
      </div>

      {/* Today's agenda */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/45">
            Agenda de hoje
          </h2>
          <Link
            href="/admin/agenda"
            className="font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-sage-light/60 hover:text-sage-light transition-colors"
          >
            Ver completa →
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-8 text-center">
            <p className="font-display font-light text-[18px] text-offwhite/[0.22] italic">
              Nenhum agendamento para hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-[6px]">
            {todayAppts.map((a: any) => {
              const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
              const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
              const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
              const cli  = Array.isArray(a.clients)    ? a.clients[0]    : a.clients
              return (
                <div key={a.id} className="flex items-center gap-4 bg-offwhite/5 border border-offwhite/[0.07] px-5 py-4">
                  <span className="font-data text-[20px] text-offwhite/60 w-12 shrink-0">
                    {slot?.start_time?.substring(0, 5) ?? '--'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-light text-[13px] text-offwhite truncate">{cli?.name ?? '—'}</p>
                    <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.15em]">
                      {svc?.name ?? '—'}
                    </p>
                  </div>
                  <span className={cn(
                    'font-body font-light text-[8px] tracking-[0.22em] uppercase px-[9px] py-[4px] border',
                    st.color
                  )}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
