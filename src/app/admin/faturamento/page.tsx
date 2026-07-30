import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, eachDayOfInterval, startOfWeek, endOfWeek, parseISO, getDay, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ReportCharts } from '@/components/admin/ReportCharts'
import { RevenueTrendCharts } from '@/components/admin/RevenueTrendCharts'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { nowAnchorInSaoPaulo, todayInSaoPaulo, weekdayInSaoPaulo, monthKeyInSaoPaulo } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  courtesy: 'Cortesia',
}

export default async function FaturamentoPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient() as any

  const now        = nowAnchorInSaoPaulo()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now),   'yyyy-MM-dd')
  const lastStart  = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

  const monthStartISO = `${monthStart}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd')}T00:00:00`
  const lastStartISO  = `${lastStart}T00:00:00`

  // 6 semanas para o gráfico de barras
  const sixWeeksAgo = format(startOfWeek(subMonths(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  // 6 meses (incluindo o atual) para o gráfico de tendência
  const sixMonthsAgoISO = `${format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')}T00:00:00`

  const [thisMonthPayRes, lastMonthPayRes, svcRankRes, weeklyRes, newClientsRes, sixMonthPayRes] = await Promise.all([
    // pagamentos recebidos no mês atual
    db.from('payments')
      .select('method, gross_amount, fee_amount, tip_amount, net_amount, paid_at, appointments(discount)')
      .gte('paid_at', monthStartISO)
      .lt('paid_at', nextMonthISO)
      .is('refunded_at', null),

    // pagamentos recebidos no mês anterior (só o bruto, pra comparação)
    db.from('payments')
      .select('gross_amount')
      .gte('paid_at', lastStartISO)
      .lt('paid_at', monthStartISO)
      .is('refunded_at', null),

    // ranking de serviços (mês atual, por data do agendamento)
    db.from('appointments')
      .select('services(name, price), time_slots!inner(date)')
      .gte('time_slots.date', monthStart)
      .lte('time_slots.date', monthEnd)
      .in('status', ['confirmed', 'completed']),

    // agendamentos por semana (últimas 6)
    db.from('appointments')
      .select('id, status, time_slots!inner(date)')
      .gte('time_slots.date', sixWeeksAgo)
      .lte('time_slots.date', monthEnd)
      .in('status', ['confirmed', 'completed']),

    // clientes novos este mês
    db.from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStartISO),

    // pagamentos dos últimos 6 meses (incluindo o atual) — base do gráfico de tendência
    db.from('payments')
      .select('gross_amount, net_amount, paid_at')
      .gte('paid_at', sixMonthsAgoISO)
      .lt('paid_at', nextMonthISO)
      .is('refunded_at', null),
  ])

  const thisMonthPay = (thisMonthPayRes.data ?? []) as any[]
  const lastMonthPay = (lastMonthPayRes.data ?? []) as any[]
  const allSvcAppt    = (svcRankRes.data      ?? []) as any[]
  const weekly         = (weeklyRes.data      ?? []) as any[]
  const newClients     = newClientsRes.count  ?? 0
  const sixMonthPay    = (sixMonthPayRes.data ?? []) as any[]

  // Faturamento (a partir de pagamentos reais)
  const grossThis = thisMonthPay.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const feeThis    = thisMonthPay.reduce((sum, p) => sum + Number(p.fee_amount   ?? 0), 0)
  const tipsThis   = thisMonthPay.reduce((sum, p) => sum + Number(p.tip_amount   ?? 0), 0)
  const netThis    = thisMonthPay.reduce((sum, p) => sum + Number(p.net_amount   ?? 0), 0)
  const grossLast  = lastMonthPay.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const revDiff    = grossLast > 0 ? ((grossThis - grossLast) / grossLast) * 100 : null
  const discountsThis = thisMonthPay.reduce((sum, p) => {
    const appt = Array.isArray(p.appointments) ? p.appointments[0] : p.appointments
    return sum + Number(appt?.discount ?? 0)
  }, 0)
  const atendimentosCount = thisMonthPay.length

  // Ticket médio
  const avgTicket = thisMonthPay.length > 0 ? grossThis / thisMonthPay.length : 0

  // Melhor dia do mês (por faturamento bruto) e dia da semana mais forte (média por ocorrência)
  const byDateRevenue: Record<string, number> = {}
  const byWeekdayRevenue: Record<number, number> = {}
  for (const p of thisMonthPay) {
    const d = todayInSaoPaulo(parseISO(p.paid_at))
    const amount = Number(p.gross_amount ?? 0)
    byDateRevenue[d] = (byDateRevenue[d] ?? 0) + amount
    const weekday = weekdayInSaoPaulo(parseISO(p.paid_at))
    byWeekdayRevenue[weekday] = (byWeekdayRevenue[weekday] ?? 0) + amount
  }
  const elapsedDays = eachDayOfInterval({ start: monthStart, end: isBefore(now, monthEnd) ? now : monthEnd })
  const weekdayOccurrences: Record<number, number> = {}
  for (const d of elapsedDays) {
    const weekday = getDay(d)
    weekdayOccurrences[weekday] = (weekdayOccurrences[weekday] ?? 0) + 1
  }
  const WEEKDAY_FULL  = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  // Ordem Dom→Sáb, para o gráfico da semana (inclui dias sem ocorrência ainda, com média 0)
  const weekdayAverages = WEEKDAY_SHORT.map((label, wd) => ({
    weekday: wd,
    label,
    avg: weekdayOccurrences[wd] ? (byWeekdayRevenue[wd] ?? 0) / weekdayOccurrences[wd] : 0,
  }))
  const topWeekday = [...weekdayAverages]
    .filter(w => weekdayOccurrences[w.weekday])
    .sort((a, b) => b.avg - a.avg)[0]
    ?? null
  const topWeekdayFull = topWeekday ? { ...topWeekday, label: WEEKDAY_FULL[topWeekday.weekday] } : null

  const bestDayEntry = Object.entries(byDateRevenue).sort((a, b) => b[1] - a[1])[0]
  const bestDay = bestDayEntry
    ? { date: format(parseISO(bestDayEntry[0]), "d 'de' MMMM", { locale: ptBR }), revenue: bestDayEntry[1] }
    : null

  // Tendência de receita — últimos 6 meses
  const monthlyBuckets: Record<string, { gross: number; net: number }> = {}
  for (const p of sixMonthPay) {
    const key = monthKeyInSaoPaulo(parseISO(p.paid_at))
    if (!monthlyBuckets[key]) monthlyBuckets[key] = { gross: 0, net: 0 }
    monthlyBuckets[key].gross += Number(p.gross_amount ?? 0)
    monthlyBuckets[key].net   += Number(p.net_amount   ?? 0)
  }
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(now, 5 - i)
    const key = format(m, 'yyyy-MM')
    return {
      label: format(m, 'MMM', { locale: ptBR }).replace('.', ''),
      gross: monthlyBuckets[key]?.gross ?? 0,
    }
  })

  // Receita dia a dia do mês atual
  const dailyThisMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(d => {
    const ds = format(d, 'yyyy-MM-dd')
    return { label: format(d, 'd'), revenue: byDateRevenue[ds] ?? 0 }
  })

  // Breakdown por método de pagamento
  const methodMap: Record<string, { count: number; gross: number; net: number }> = {}
  for (const p of thisMonthPay) {
    const m = p.method as string
    if (!methodMap[m]) methodMap[m] = { count: 0, gross: 0, net: 0 }
    methodMap[m].count++
    methodMap[m].gross += Number(p.gross_amount ?? 0)
    methodMap[m].net   += Number(p.net_amount   ?? 0)
  }
  const paymentBreakdown = Object.entries(methodMap)
    .map(([method, v]) => ({ method, label: METHOD_LABEL[method] ?? method, ...v }))
    .sort((a, b) => b.gross - a.gross)

  // Taxa de cancelamento do mês
  const totalMonthRes = await db
    .from('appointments')
    .select('id, time_slots!inner(date)', { count: 'exact', head: true })
    .gte('time_slots.date', monthStart)
    .lte('time_slots.date', monthEnd)

  const cancelledRes = await db
    .from('appointments')
    .select('id, time_slots!inner(date)', { count: 'exact', head: true })
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
    <div className="px-6 py-8 space-y-10">
      {/* Header */}
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Faturamento</h1>
        <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.15em] mt-1 capitalize">{monthLabel}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Faturamento bruto */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Faturamento bruto</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(grossThis)}</p>
          {revDiff !== null && (
            <p className={`font-body font-light text-[9px] tracking-[0.12em] ${revDiff >= 0 ? 'text-sage-light' : 'text-error/60'}`}>
              {revDiff >= 0 ? '↑' : '↓'} {Math.abs(revDiff).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>

        {/* Taxas pagas */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Taxas de pagamento</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(feeThis)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {grossThis > 0 ? ((feeThis / grossThis) * 100).toFixed(1) : '0.0'}% do bruto
          </p>
        </div>

        {/* Faturamento líquido */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Faturamento líquido</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(netThis)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">após taxas</p>
        </div>

        {/* Ticket médio */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Ticket médio</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(avgTicket)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {thisMonthPay.length} pagamento{thisMonthPay.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Taxa de cancelamento */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Cancelamentos</p>
          <p className={`font-data text-[26px] leading-none mb-2 ${cancelRate > 20 ? 'text-error/70' : 'text-offwhite'}`}>
            {cancelRate.toFixed(1)}%
          </p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {cancelledMonth} de {totalMonth} marcados
          </p>
        </div>

        {/* Clientes novos */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Clientes novos</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{newClients}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">este mês</p>
        </div>

        {/* Atendimentos */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Atendimentos</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{atendimentosCount}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">concluídos este mês</p>
        </div>

        {/* Descontos concedidos */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Descontos concedidos</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(discountsThis)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {grossThis > 0 ? ((discountsThis / grossThis) * 100).toFixed(1) : '0.0'}% do bruto
          </p>
        </div>

        {/* Gorjetas recebidas */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Gorjetas recebidas</p>
          <p className="font-data text-[26px] text-sage-light leading-none mb-2">{fmt(tipsThis)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">registradas no checkout</p>
        </div>
      </div>

      {/* Insights do mês */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Insights do mês
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-gold/60 mb-3">Melhor dia</p>
            {bestDay ? (
              <>
                <p className="font-display font-light text-[19px] text-offwhite leading-none mb-2 capitalize">{bestDay.date}</p>
                <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{fmt(bestDay.revenue)} faturados</p>
              </>
            ) : (
              <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem dados este mês.</p>
            )}
          </div>

          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-gold/60 mb-3">Dia da semana top</p>
            {topWeekdayFull ? (
              <>
                <p className="font-display font-light text-[19px] text-offwhite leading-none mb-2">{topWeekdayFull.label}</p>
                <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{fmt(topWeekdayFull.avg)} em média</p>
              </>
            ) : (
              <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem dados este mês.</p>
            )}
          </div>

          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-gold/60 mb-3">Forma de pagamento top</p>
            {paymentBreakdown[0] ? (
              <>
                <p className="font-display font-light text-[19px] text-offwhite leading-none mb-2">{paymentBreakdown[0].label}</p>
                <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{fmt(paymentBreakdown[0].gross)} recebidos</p>
              </>
            ) : (
              <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem dados este mês.</p>
            )}
          </div>
        </div>
      </section>

      {/* Tendência de receita — client component */}
      <RevenueTrendCharts monthlyTrend={monthlyTrend} weekdayAverages={weekdayAverages} dailyThisMonth={dailyThisMonth} />

      {/* Charts + ranking — client component */}
      <ReportCharts weeklyData={weeklyData} svcRanking={svcRanking} paymentBreakdown={paymentBreakdown} />
    </div>
  )
}
