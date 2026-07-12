import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ReportCharts } from '@/components/admin/ReportCharts'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function RelatoriosPage() {
  const db = await createServiceClient() as any

  const now        = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now),   'yyyy-MM-dd')
  const lastStart  = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const lastEnd    = format(endOfMonth(subMonths(now, 1)),   'yyyy-MM-dd')

  // 6 semanas para o gráfico de barras
  const sixWeeksAgo = format(startOfWeek(subMonths(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [thisMonthRes, lastMonthRes, svcRankRes, weeklyRes, newClientsRes] = await Promise.all([
    // agendamentos concluídos do mês atual com preço
    db.from('appointments')
      .select('id, status, services(price), time_slots(date)')
      .gte('time_slots.date', monthStart)
      .lte('time_slots.date', monthEnd)
      .in('status', ['confirmed', 'completed']),

    // mês anterior
    db.from('appointments')
      .select('id, status, services(price), time_slots(date)')
      .gte('time_slots.date', lastStart)
      .lte('time_slots.date', lastEnd)
      .in('status', ['confirmed', 'completed']),

    // ranking de serviços (mês atual)
    db.from('appointments')
      .select('services(name, price), time_slots(date)')
      .gte('time_slots.date', monthStart)
      .lte('time_slots.date', monthEnd)
      .in('status', ['confirmed', 'completed']),

    // agendamentos por semana (últimas 6)
    db.from('appointments')
      .select('id, status, time_slots(date)')
      .gte('time_slots.date', sixWeeksAgo)
      .lte('time_slots.date', monthEnd)
      .in('status', ['confirmed', 'completed']),

    // clientes novos este mês
    db.from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart + 'T00:00:00'),
  ])

  const thisMonth  = (thisMonthRes.data  ?? []) as any[]
  const lastMonth  = (lastMonthRes.data  ?? []) as any[]
  const allSvcAppt = (svcRankRes.data    ?? []) as any[]
  const weekly     = (weeklyRes.data     ?? []) as any[]
  const newClients = newClientsRes.count ?? 0

  // Faturamento
  const revenue = (appts: any[]) =>
    appts.reduce((sum, a) => {
      const svc = Array.isArray(a.services) ? a.services[0] : a.services
      return sum + (svc?.price ?? 0)
    }, 0)

  const revenueThis = revenue(thisMonth)
  const revenueLast = revenue(lastMonth)
  const revDiff     = revenueLast > 0 ? ((revenueThis - revenueLast) / revenueLast) * 100 : null

  // Ticket médio
  const avgTicket = thisMonth.length > 0 ? revenueThis / thisMonth.length : 0

  // Taxa de cancelamento do mês
  const totalMonthRes = await db
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('time_slots.date', monthStart)
    .lte('time_slots.date', monthEnd)

  const cancelledRes = await db
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('time_slots.date', monthStart)
    .lte('time_slots.date', monthEnd)
    .eq('status', 'cancelled')

  const totalMonth     = totalMonthRes.count  ?? 0
  const cancelledMonth = cancelledRes.count   ?? 0
  const cancelRate     = totalMonth > 0 ? (cancelledMonth / totalMonth) * 100 : 0

  // Ranking de serviços
  const svcMap: Record<string, { count: number; revenue: number }> = {}
  for (const a of allSvcAppt) {
    const svc = Array.isArray(a.services) ? a.services[0] : a.services
    if (!svc?.name) continue
    if (!svcMap[svc.name]) svcMap[svc.name] = { count: 0, revenue: 0 }
    svcMap[svc.name].count++
    svcMap[svc.name].revenue += svc.price ?? 0
  }
  const svcRanking = Object.entries(svcMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Dados semanais para o gráfico
  const weeks = eachWeekOfInterval(
    { start: new Date(sixWeeksAgo), end: now },
    { weekStartsOn: 1 }
  ).slice(-6)

  const weeklyData = weeks.map(weekStart => {
    const wEnd  = endOfWeek(weekStart, { weekStartsOn: 1 })
    const wS    = format(weekStart, 'yyyy-MM-dd')
    const wE    = format(wEnd,      'yyyy-MM-dd')
    const count = weekly.filter(a => {
      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
      const d = slot?.date ?? ''
      return d >= wS && d <= wE
    }).length
    return {
      label: format(weekStart, "d/MM", { locale: ptBR }),
      count,
    }
  })

  const monthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Relatórios</h1>
        <p className="font-body font-light text-[10px] text-offwhite/28 tracking-[0.15em] mt-1 capitalize">{monthLabel}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Faturamento</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(revenueThis)}</p>
          {revDiff !== null && (
            <p className={`font-body font-light text-[9px] tracking-[0.12em] ${revDiff >= 0 ? 'text-sage-light' : 'text-error/60'}`}>
              {revDiff >= 0 ? '↑' : '↓'} {Math.abs(revDiff).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>

        {/* Ticket médio */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Ticket médio</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(avgTicket)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {thisMonth.length} atendimento{thisMonth.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Taxa de cancelamento */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Cancelamentos</p>
          <p className={`font-data text-[26px] leading-none mb-2 ${cancelRate > 20 ? 'text-error/70' : 'text-offwhite'}`}>
            {cancelRate.toFixed(1)}%
          </p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {cancelledMonth} de {totalMonth} marcados
          </p>
        </div>

        {/* Clientes novos */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Clientes novos</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{newClients}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">este mês</p>
        </div>
      </div>

      {/* Charts + ranking — client component */}
      <ReportCharts weeklyData={weeklyData} svcRanking={svcRanking} />
    </div>
  )
}
