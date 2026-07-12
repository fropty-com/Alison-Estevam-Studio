import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { ReportCharts } from '@/components/admin/ReportCharts'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'

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

export default async function RelatoriosPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient() as any

  const now        = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now),   'yyyy-MM-dd')
  const lastStart  = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

  const monthStartISO = `${monthStart}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd')}T00:00:00`
  const lastStartISO  = `${lastStart}T00:00:00`

  // 6 semanas para o gráfico de barras
  const sixWeeksAgo = format(startOfWeek(subMonths(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [thisMonthPayRes, lastMonthPayRes, svcRankRes, weeklyRes, newClientsRes, retentionRes] = await Promise.all([
    // pagamentos recebidos no mês atual
    db.from('payments')
      .select('method, gross_amount, fee_amount, net_amount, paid_at')
      .gte('paid_at', monthStartISO)
      .lt('paid_at', nextMonthISO),

    // pagamentos recebidos no mês anterior (só o bruto, pra comparação)
    db.from('payments')
      .select('gross_amount')
      .gte('paid_at', lastStartISO)
      .lt('paid_at', monthStartISO),

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

    // histórico completo de atendimentos concluídos, por cliente — base para retenção
    db.from('appointments')
      .select('client_id, clients(id, name), time_slots!inner(date)')
      .eq('status', 'completed'),
  ])

  const thisMonthPay = (thisMonthPayRes.data ?? []) as any[]
  const lastMonthPay = (lastMonthPayRes.data ?? []) as any[]
  const allSvcAppt    = (svcRankRes.data      ?? []) as any[]
  const weekly         = (weeklyRes.data      ?? []) as any[]
  const newClients     = newClientsRes.count  ?? 0
  const completedHistory = (retentionRes.data ?? []) as any[]

  // Faturamento (a partir de pagamentos reais)
  const grossThis = thisMonthPay.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const feeThis    = thisMonthPay.reduce((sum, p) => sum + Number(p.fee_amount   ?? 0), 0)
  const netThis    = thisMonthPay.reduce((sum, p) => sum + Number(p.net_amount   ?? 0), 0)
  const grossLast  = lastMonthPay.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const revDiff    = grossLast > 0 ? ((grossThis - grossLast) / grossLast) * 100 : null

  // Ticket médio
  const avgTicket = thisMonthPay.length > 0 ? grossThis / thisMonthPay.length : 0

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

  // Retenção — a partir do histórico completo de atendimentos concluídos.
  // Cada cliente vira { name, dates[] } ordenado, e disso derivamos taxa de
  // recorrência, intervalo médio entre visitas, e quem está atrasado em
  // relação ao próprio padrão de retorno.
  const clientHistory: Record<string, { id: string; name: string; dates: string[] }> = {}
  for (const a of completedHistory) {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
    const slot   = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    if (!client?.id || !slot?.date) continue
    if (!clientHistory[client.id]) clientHistory[client.id] = { id: client.id, name: client.name, dates: [] }
    clientHistory[client.id].dates.push(slot.date)
  }

  const clients = Object.values(clientHistory).map(c => ({ ...c, dates: c.dates.sort() }))
  const totalReturningClients = clients.length
  const recurringClients = clients.filter(c => c.dates.length >= 2)
  const retentionRate = totalReturningClients > 0 ? (recurringClients.length / totalReturningClients) * 100 : 0

  const allGaps: number[] = []
  const atRisk: { id: string; name: string; daysSinceLast: number; avgGap: number }[] = []

  for (const c of recurringClients) {
    const gaps: number[] = []
    for (let i = 1; i < c.dates.length; i++) {
      gaps.push(differenceInDays(parseISO(c.dates[i]), parseISO(c.dates[i - 1])))
    }
    allGaps.push(...gaps)

    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length
    const daysSinceLast = differenceInDays(now, parseISO(c.dates[c.dates.length - 1]))
    if (daysSinceLast > Math.max(avgGap * 1.5, 30)) {
      atRisk.push({ id: c.id, name: c.name, daysSinceLast, avgGap: Math.round(avgGap) })
    }
  }
  const avgDaysBetweenVisits = allGaps.length > 0 ? allGaps.reduce((sum, g) => sum + g, 0) / allGaps.length : null
  atRisk.sort((a, b) => b.daysSinceLast - a.daysSinceLast)
  const atRiskTop = atRisk.slice(0, 8)

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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Faturamento bruto */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Faturamento bruto</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(grossThis)}</p>
          {revDiff !== null && (
            <p className={`font-body font-light text-[9px] tracking-[0.12em] ${revDiff >= 0 ? 'text-sage-light' : 'text-error/60'}`}>
              {revDiff >= 0 ? '↑' : '↓'} {Math.abs(revDiff).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>

        {/* Taxas pagas */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Taxas de pagamento</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(feeThis)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {grossThis > 0 ? ((feeThis / grossThis) * 100).toFixed(1) : '0.0'}% do bruto
          </p>
        </div>

        {/* Faturamento líquido */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Faturamento líquido</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(netThis)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">após taxas</p>
        </div>

        {/* Ticket médio */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Ticket médio</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(avgTicket)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {thisMonthPay.length} pagamento{thisMonthPay.length !== 1 ? 's' : ''}
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

      {/* Retenção de clientes */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Retenção de clientes
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-offwhite/3 border border-offwhite/7 p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Taxa de retenção</p>
            <p className="font-data text-[26px] text-offwhite leading-none mb-2">{retentionRate.toFixed(1)}%</p>
            <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
              {recurringClients.length} de {totalReturningClients} clientes voltaram
            </p>
          </div>

          <div className="bg-offwhite/3 border border-offwhite/7 p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Intervalo médio</p>
            <p className="font-data text-[26px] text-offwhite leading-none mb-2">
              {avgDaysBetweenVisits !== null ? `${Math.round(avgDaysBetweenVisits)}d` : '—'}
            </p>
            <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">entre visitas</p>
          </div>

          <div className="bg-offwhite/3 border border-offwhite/7 p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-3">Em risco de sumir</p>
            <p className={`font-data text-[26px] leading-none mb-2 ${atRisk.length > 0 ? 'text-error/70' : 'text-offwhite'}`}>
              {atRisk.length}
            </p>
            <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">clientes atrasados</p>
          </div>
        </div>

        <div className="bg-offwhite/3 border border-offwhite/7 p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-6">
            Clientes em risco — atrasados em relação ao próprio padrão
          </p>

          {atRiskTop.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/22 italic">
              Nenhum cliente recorrente atrasado no momento.
            </p>
          ) : (
            <div className="divide-y divide-offwhite/6 -mx-6">
              {atRiskTop.map(c => (
                <Link
                  key={c.id}
                  href={`/admin/clientes/${c.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-offwhite/3 transition-colors"
                >
                  <span className="font-body font-light text-[12px] text-offwhite/70">{c.name}</span>
                  <span className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em]">
                    {c.daysSinceLast}d sem voltar <span className="text-offwhite/18">· costuma voltar a cada {c.avgGap}d</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Charts + ranking — client component */}
      <ReportCharts weeklyData={weeklyData} svcRanking={svcRanking} paymentBreakdown={paymentBreakdown} />
    </div>
  )
}
