import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ServiceRow } from '@/components/admin/ServiceRow'
import { ServicoCharts } from '@/components/admin/ServicoCharts'

export const dynamic = 'force-dynamic'

const STALE_DAYS = 30

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function ServicosPage() {
  const db = await createServiceClient() as any

  const now         = new Date()
  const monthStart  = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd    = format(endOfMonth(now), 'yyyy-MM-dd')
  const sixMonthsAgoStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')

  const [servicesRes, monthApptRes, historyRes, sixMonthApptRes] = await Promise.all([
    db.from('services')
      .select('id, name, slug, description, duration, price, active, position, hidden_from_list')
      .order('position', { ascending: true }),

    // agendamentos concluídos este mês — base de quase todas as métricas
    db.from('appointments')
      .select('id, service_id, service_price, total_price, services(name, duration, hidden_from_list), time_slots!inner(date)')
      .eq('status', 'completed')
      .gte('time_slots.date', monthStart)
      .lte('time_slots.date', monthEnd),

    // histórico completo (todas as datas) — só o necessário pra achar a última vez que cada serviço foi realizado
    db.from('appointments')
      .select('service_id, time_slots!inner(date)')
      .eq('status', 'completed'),

    // últimos 6 meses — base do gráfico de tendência
    db.from('appointments')
      .select('service_price, time_slots!inner(date)')
      .eq('status', 'completed')
      .gte('time_slots.date', sixMonthsAgoStart)
      .lte('time_slots.date', monthEnd),
  ])

  const services  = (servicesRes.data   ?? []) as any[]
  const rawMonth  = (monthApptRes.data  ?? []) as any[]
  const history   = (historyRes.data    ?? []) as any[]
  const sixMonth  = (sixMonthApptRes.data ?? []) as any[]

  const monthAppts = rawMonth.map(a => {
    const svc  = Array.isArray(a.services) ? a.services[0] : a.services
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    return {
      id: a.id as string,
      serviceId: a.service_id as string,
      serviceName: svc?.name ?? '—',
      duration: Number(svc?.duration ?? 0),
      hidden: !!svc?.hidden_from_list,
      servicePrice: Number(a.service_price ?? 0),
      totalPrice: Number(a.total_price ?? 0),
      date: slot?.date as string | undefined,
    }
  })

  // Última vez que cada serviço foi realizado, a partir do histórico completo
  const lastUsedByService: Record<string, string> = {}
  for (const a of history) {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    if (!a.service_id || !slot?.date) continue
    if (!lastUsedByService[a.service_id] || slot.date > lastUsedByService[a.service_id]) {
      lastUsedByService[a.service_id] = slot.date
    }
  }

  // ── Cards do mês ──
  const receitaServicos   = monthAppts.reduce((sum, a) => sum + a.servicePrice, 0)
  const servicosRealizados = monthAppts.length
  const totalCadastrados  = services.filter(s => s.active).length
  const ticketMedio       = monthAppts.length > 0 ? monthAppts.reduce((sum, a) => sum + a.totalPrice, 0) / monthAppts.length : 0
  const duracaoMedia      = monthAppts.length > 0 ? monthAppts.reduce((sum, a) => sum + a.duration, 0) / monthAppts.length : 0
  const cuidadosAvulsos   = monthAppts.filter(a => a.hidden).length

  // ── Contagem/receita por serviço, este mês ──
  const byService: Record<string, { name: string; count: number; revenue: number; duration: number }> = {}
  for (const a of monthAppts) {
    const s = (byService[a.serviceId] ??= { name: a.serviceName, count: 0, revenue: 0, duration: a.duration })
    s.count++
    s.revenue += a.servicePrice
  }

  // ── Insights ──
  const campeaoVendas = Object.values(byService).sort((a, b) => b.count - a.count)[0] ?? null
  const maiorReceita   = Object.values(byService).sort((a, b) => b.revenue - a.revenue)[0] ?? null
  const maisEficiente  = Object.values(byService)
    .filter(s => s.duration > 0)
    .map(s => ({ ...s, perHour: (s.revenue / s.count) / s.duration * 60 }))
    .sort((a, b) => b.perHour - a.perHour)[0] ?? null

  const activeServices = services.filter(s => s.active)
  const staleList = activeServices
    .map(s => {
      const last = lastUsedByService[s.id]
      const daysSince = last ? differenceInDays(now, parseISO(last)) : null
      return { id: s.id, name: s.name, daysSince, neverUsed: !last }
    })
    .filter(s => s.neverUsed || (s.daysSince !== null && s.daysSince > STALE_DAYS))
    .sort((a, b) => (b.daysSince ?? 99999) - (a.daysSince ?? 99999))

  const piorParado = staleList[0] ?? null

  // ── Rankings ──
  const maisRealizados = Object.values(byService).sort((a, b) => b.count - a.count).slice(0, 6)
  const menosRealizados = activeServices
    .map(s => ({ name: s.name, count: byService[s.id]?.count ?? 0 }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 6)

  // ── Receita por hora (catálogo, todos os serviços ativos) ──
  const receitaPorHora = activeServices
    .filter(s => s.duration > 0)
    .map(s => ({ name: s.name, perHour: (Number(s.price) / s.duration) * 60 }))
    .sort((a, b) => b.perHour - a.perHour)

  // ── Tendência de receita de serviços — 6 meses ──
  const monthlyBuckets: Record<string, number> = {}
  for (const a of sixMonth) {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    if (!slot?.date) continue
    const key = slot.date.slice(0, 7)
    monthlyBuckets[key] = (monthlyBuckets[key] ?? 0) + Number(a.service_price ?? 0)
  }
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(now, 5 - i)
    const key = format(m, 'yyyy-MM')
    return { label: format(m, 'MMM', { locale: ptBR }).replace('.', ''), revenue: monthlyBuckets[key] ?? 0 }
  })

  // ── Realizados juntos: par serviço + complemento, este mês ──
  const monthApptIds = monthAppts.map(a => a.id)
  const pairMap: Record<string, number> = {}
  if (monthApptIds.length > 0) {
    const { data: pairData } = await db
      .from('appointment_complements')
      .select('appointment_id, complements(name)')
      .in('appointment_id', monthApptIds)
    const apptById = new Map(monthAppts.map(a => [a.id, a]))
    for (const row of (pairData ?? []) as any[]) {
      const appt = apptById.get(row.appointment_id)
      const complement = Array.isArray(row.complements) ? row.complements[0] : row.complements
      if (!appt || !complement?.name) continue
      const key = `${appt.serviceName} + ${complement.name}`
      pairMap[key] = (pairMap[key] ?? 0) + 1
    }
  }
  const realizadosJuntos = Object.entries(pairMap)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const monthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="px-6 py-8 space-y-10">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Serviços</h1>
        <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.15em] mt-1 capitalize">{monthLabel}</p>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Receita de serviços</p>
          <p className="font-data text-[26px] text-sage-light leading-none mb-2">{fmt(receitaServicos)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">este mês</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Serviços realizados</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{servicosRealizados}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">no período este mês</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Total cadastrados</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{totalCadastrados}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">serviços ativos</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Ticket médio</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(ticketMedio)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">por comanda com serviço</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Duração média</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{Math.round(duracaoMedia)} min</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">por serviço realizado</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Cuidados avulsos</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{cuidadosAvulsos}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">reservados sozinhos este mês</p>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">Campeão de vendas</p>
          {campeaoVendas ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{campeaoVendas.name}</p>
              <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">{campeaoVendas.count}× este mês</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem serviços deste mês.</p>}
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">Maior receita</p>
          {maiorReceita ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{maiorReceita.name}</p>
              <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">{fmt(maiorReceita.revenue)}</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem serviços deste mês.</p>}
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">Mais eficiente</p>
          {maisEficiente ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{maisEficiente.name}</p>
              <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">{fmt(maisEficiente.perHour)}/hora</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem dados de duração.</p>}
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">Mais tempo parado</p>
          {piorParado ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{piorParado.name}</p>
              <p className="font-body font-light text-[9px] text-error/60 tracking-[0.1em]">
                {piorParado.neverUsed ? 'Nunca realizado' : `${piorParado.daysSince}d sem realização`}
              </p>
            </>
          ) : <p className="font-body font-light text-[11px] text-sage-light italic">Todos os serviços ativos.</p>}
        </div>
      </div>

      <ServicoCharts
        monthlyTrend={monthlyTrend}
        maisRealizados={maisRealizados}
        menosRealizados={menosRealizados}
        staleList={staleList}
        receitaPorHora={receitaPorHora}
        realizadosJuntos={realizadosJuntos}
      />

      {/* Gestão de serviços */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Gerenciar serviços
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s: any) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </div>
      </section>
    </div>
  )
}
