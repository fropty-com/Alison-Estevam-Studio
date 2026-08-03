import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths, addDays, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import Link from 'next/link'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { ExpenseForm } from '@/components/admin/ExpenseForm'
import { ExpenseList, type ExpenseRow } from '@/components/admin/ExpenseList'
import { FinanceCharts } from '@/components/admin/FinanceCharts'
import { cn } from '@/lib/utils'
import { nowAnchorInSaoPaulo, monthKeyInSaoPaulo, todayInSaoPaulo } from '@/lib/timezone'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'

export const dynamic = 'force-dynamic'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

type Regime = 'caixa' | 'competencia'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FinanceiroPage({ searchParams }: { searchParams: { regime?: string } }) {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const regime: Regime = searchParams.regime === 'competencia' ? 'competencia' : 'caixa'

  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)
  const dateLocale = DATE_FNS_LOCALE[locale]

  const now         = nowAnchorInSaoPaulo()
  const today       = format(now, 'yyyy-MM-dd')
  const monthStart  = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd    = format(endOfMonth(now), 'yyyy-MM-dd')
  const lastStart   = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const lastEnd     = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const monthStartISO = `${monthStart}T00:00:00`
  const lastStartISO  = `${lastStart}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(subMonths(now, -1)), 'yyyy-MM-dd')}T00:00:00`
  const sixMonthsAgoISO = `${format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')}T00:00:00`
  const sixMonthsAgoStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')

  // Pedidos de produto "pagos" — mesma régua de payments.paid_at: só entra
  // como receita o que efetivamente foi pago (nunca aguardando_pagamento
  // nem cancelado). Ver migration 045 pro check constraint de status.
  const PAID_ORDER_STATUSES = ['pago', 'preparando', 'enviado', 'pronto_retirada', 'concluido']

  const [thisMonthPayRes, sixMonthPayRes, expensesRes, receivableRes, thisMonthOrdersRes, lastMonthOrdersRes] = await Promise.all([
    db.from('payments')
      .select('gross_amount, net_amount, paid_at, appointments(discount)')
      .gte('paid_at', monthStartISO)
      .lt('paid_at', nextMonthISO)
      .is('refunded_at', null),

    db.from('payments')
      .select('gross_amount, net_amount, paid_at')
      .gte('paid_at', sixMonthsAgoISO)
      .lt('paid_at', nextMonthISO)
      .is('refunded_at', null),

    // todas as despesas — tabela pequena o bastante pra um único negócio,
    // e a agregação (aging, categorias, vencimentos, tendência) precisa do
    // histórico completo, não só do mês corrente
    db.from('expenses')
      .select('id, description, category, amount, is_fixed, due_date, paid_date')
      .order('due_date', { ascending: false })
      .limit(500),

    // agendamentos futuros ainda não concluídos — base do "A Receber"
    db.from('appointments')
      .select('id, total_price, time_slots!inner(date)')
      .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress'])
      .gte('time_slots.date', today),

    // pedidos de produto pagos no mês atual
    db.from('orders')
      .select('subtotal, discount_amount, shipping_cost, total')
      .in('status', PAID_ORDER_STATUSES)
      .gte('created_at', monthStartISO)
      .lt('created_at', nextMonthISO),

    // pedidos de produto pagos no mês anterior (comparação)
    db.from('orders')
      .select('total')
      .in('status', PAID_ORDER_STATUSES)
      .gte('created_at', lastStartISO)
      .lt('created_at', monthStartISO),
  ])

  const thisMonthPay = thisMonthPayRes.data ?? []
  const sixMonthPay   = sixMonthPayRes.data  ?? []
  const allExpenses   = expensesRes.data     ?? []
  const receivable    = receivableRes.data   ?? []
  const thisMonthOrders = thisMonthOrdersRes.data ?? []
  const lastMonthOrders = lastMonthOrdersRes.data ?? []

  // ── Receita de produtos — categoria própria, separada da receita de
  // serviços acima (ver DRE de produtos abaixo, exibido lado a lado) ──
  const productSubtotalThis = thisMonthOrders.reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0)
  const productDiscountThis = thisMonthOrders.reduce((sum, o) => sum + Number(o.discount_amount ?? 0), 0)
  const productShippingThis = thisMonthOrders.reduce((sum, o) => sum + Number(o.shipping_cost ?? 0), 0)
  const productTotalThis    = thisMonthOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const productTotalLast    = lastMonthOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const productRevDiff = productTotalLast > 0 ? ((productTotalThis - productTotalLast) / productTotalLast) * 100 : null

  // ── Receita do mês (igual nos dois regimes, já que pagamento e conclusão
  // do serviço acontecem juntos neste negócio — a diferença de regime pesa
  // mesmo é do lado das despesas) ──
  const grossThis = thisMonthPay.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const discountsThis = thisMonthPay.reduce((sum, p) => {
    const appt = Array.isArray(p.appointments) ? p.appointments[0] : p.appointments
    return sum + Number(appt?.discount ?? 0)
  }, 0)
  const receitaLiquida = grossThis - discountsThis

  // ── Despesas do mês, conforme o regime contábil ──
  const expenseDateField = regime === 'caixa' ? 'paid_date' : 'due_date'
  const expensesThisMonth = allExpenses.filter(e => {
    const d = e[expenseDateField]
    return d && d >= monthStart && d <= monthEnd
  })
  const despesasThis = expensesThisMonth.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

  const expensesLastMonth = allExpenses.filter(e => {
    const d = e[expenseDateField]
    return d && d >= lastStart && d <= lastEnd
  })
  const despesasLast = expensesLastMonth.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

  const lucroLiquido = receitaLiquida - despesasThis
  const margemOperacional = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0

  // ── A Receber / A Pagar em aberto ──
  const aReceber = receivable.reduce((sum, a) => sum + Number(a.total_price ?? 0), 0)
  const unpaidExpenses = allExpenses.filter(e => !e.paid_date)
  const aPagar = unpaidExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

  // ── Maior despesa do mês ──
  const maiorDespesa = [...expensesThisMonth].sort((a, b) => Number(b.amount) - Number(a.amount))[0] ?? null

  // ── Categoria que mais cresceu (mês atual vs anterior) ──
  const byCategoryThis: Record<string, number> = {}
  for (const e of expensesThisMonth) byCategoryThis[e.category] = (byCategoryThis[e.category] ?? 0) + Number(e.amount)
  const byCategoryLast: Record<string, number> = {}
  for (const e of expensesLastMonth) byCategoryLast[e.category] = (byCategoryLast[e.category] ?? 0) + Number(e.amount)
  let categoriaQueMaisCresceu: { category: string; diff: number } | null = null
  for (const cat of Object.keys(byCategoryThis)) {
    const diff = byCategoryThis[cat] - (byCategoryLast[cat] ?? 0)
    if (!categoriaQueMaisCresceu || diff > categoriaQueMaisCresceu.diff) categoriaQueMaisCresceu = { category: cat, diff }
  }

  // ── Tendência 6 meses (receita líquida × despesas × lucro) ──
  const monthlyRevenue: Record<string, number> = {}
  for (const p of sixMonthPay) {
    const key = monthKeyInSaoPaulo(parseISO(p.paid_at))
    monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + Number(p.gross_amount ?? 0)
  }
  const sixMonthExpenses = allExpenses.filter(e => e[expenseDateField] && e[expenseDateField]! >= sixMonthsAgoStart)
  const monthlyExpenses: Record<string, number> = {}
  for (const e of sixMonthExpenses) {
    const key = e[expenseDateField]!.slice(0, 7)
    monthlyExpenses[key] = (monthlyExpenses[key] ?? 0) + Number(e.amount ?? 0)
  }
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(now, 5 - i)
    const key = format(m, 'yyyy-MM')
    const revenue = monthlyRevenue[key] ?? 0
    const expenses = monthlyExpenses[key] ?? 0
    return {
      label: format(m, 'MMM', { locale: dateLocale }).replace('.', ''),
      revenue,
      expenses,
      profit: revenue - expenses,
    }
  })
  const mesMaisLucrativo = [...monthlyTrend].sort((a, b) => b.profit - a.profit)[0] ?? null

  // ── Fluxo de caixa diário do mês (entradas x saídas pagas) ──
  const dailyIn: Record<string, number> = {}
  for (const p of thisMonthPay) {
    const d = todayInSaoPaulo(parseISO(p.paid_at))
    dailyIn[d] = (dailyIn[d] ?? 0) + Number(p.gross_amount ?? 0)
  }
  const dailyOut: Record<string, number> = {}
  for (const e of allExpenses) {
    if (e.paid_date && e.paid_date >= monthStart && e.paid_date <= monthEnd) {
      dailyOut[e.paid_date] = (dailyOut[e.paid_date] ?? 0) + Number(e.amount ?? 0)
    }
  }
  const dailyCashFlow = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(d => {
    const ds = format(d, 'yyyy-MM-dd')
    return { label: format(d, 'd'), in: dailyIn[ds] ?? 0, out: dailyOut[ds] ?? 0 }
  })
  const hasCashMovement = Object.keys(dailyIn).length > 0 || Object.keys(dailyOut).length > 0

  // ── Despesas por categoria (mês atual) ──
  const categoryBreakdown = Object.entries(byCategoryThis)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  // ── Fixas vs Variáveis (mês atual) ──
  const fixedTotal    = expensesThisMonth.filter(e => e.is_fixed).reduce((sum, e) => sum + Number(e.amount), 0)
  const variableTotal = expensesThisMonth.filter(e => !e.is_fixed).reduce((sum, e) => sum + Number(e.amount), 0)

  // ── Contas atrasadas (aging) ──
  const agingBuckets = [
    { label: t.finance.agingBuckets[0], min: 1, max: 15, total: 0, count: 0 },
    { label: t.finance.agingBuckets[1], min: 16, max: 30, total: 0, count: 0 },
    { label: t.finance.agingBuckets[2], min: 31, max: 60, total: 0, count: 0 },
    { label: t.finance.agingBuckets[3], min: 61, max: Infinity, total: 0, count: 0 },
  ]
  let piorAging: { description: string; daysOverdue: number } | null = null
  for (const e of unpaidExpenses) {
    const daysOverdue = differenceInDays(now, parseISO(e.due_date))
    if (daysOverdue < 1) continue
    const bucket = agingBuckets.find(b => daysOverdue >= b.min && daysOverdue <= b.max)
    if (bucket) { bucket.total += Number(e.amount); bucket.count++ }
    if (!piorAging || daysOverdue > piorAging.daysOverdue) piorAging = { description: e.description, daysOverdue }
  }
  const hasOverdue = agingBuckets.some(b => b.count > 0)

  // ── Próximos vencimentos (7 / 15 / 30 dias) ──
  const upcomingBuckets = [7, 15, 30].map(days => {
    const limit = format(addDays(now, days), 'yyyy-MM-dd')
    const aReceberBucket = receivable
      .filter(a => {
        const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
        return slot?.date && slot.date >= today && slot.date <= limit
      })
      .reduce((sum, a) => sum + Number(a.total_price ?? 0), 0)
    const aPagarBucket = unpaidExpenses
      .filter(e => e.due_date >= today && e.due_date <= limit)
      .reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
    const aReceberCount = receivable.filter(a => {
      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
      return slot?.date && slot.date >= today && slot.date <= limit
    }).length
    const aPagarCount = unpaidExpenses.filter(e => e.due_date >= today && e.due_date <= limit).length
    return { days, aReceber: aReceberBucket, aReceberCount, aPagar: aPagarBucket, aPagarCount }
  })

  const expenseRows: ExpenseRow[] = allExpenses.slice(0, 30).map(e => ({
    id: e.id,
    description: e.description,
    category: e.category,
    amount: Number(e.amount),
    isFixed: e.is_fixed,
    dueDate: e.due_date,
    paidDate: e.paid_date,
    dueLabel: format(parseISO(e.due_date), locale === 'pt' ? "d 'de' MMM" : 'MMM d', { locale: dateLocale }),
  }))

  const monthLabel = format(now, locale === 'pt' ? "MMMM 'de' yyyy" : 'MMMM yyyy', { locale: dateLocale })

  return (
    <div className="px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">{t.finance.eyebrow}</p>
          <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.finance.title}</h1>
          <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.15em] mt-1 capitalize">{monthLabel}</p>
        </div>
        <div>
          <p className="font-body font-light text-[8px] tracking-[0.2em] uppercase text-offwhite/30 mb-[6px]">{t.finance.accountingRegime}</p>
          <div className="flex border border-offwhite/[0.14] h-[34px] p-[2px]">
            {(['caixa', 'competencia'] as Regime[]).map(r => (
              <Link
                key={r}
                href={`/admin/financeiro?regime=${r}`}
                className={cn(
                  'flex items-center justify-center h-full px-4 font-body font-light text-[9px] tracking-[0.14em] uppercase transition-all duration-150',
                  regime === r ? 'bg-gold text-charcoal-deep' : 'text-offwhite/50 hover:text-offwhite'
                )}
              >
                {r === 'caixa' ? t.finance.cash : t.finance.accrual}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.expensesTitle(regime === 'caixa' ? t.finance.cards.paid : t.finance.cards.accrualLabel)}</p>
          <p className="font-data text-[26px] text-error/80 leading-none mb-2">{fmt(despesasThis)}</p>
          <p className={cn('font-body font-light text-[9px] tracking-[0.12em]', despesasThis >= despesasLast ? 'text-error/60' : 'text-sage-light')}>
            {despesasLast > 0 ? t.finance.cards.vsLastMonth(despesasThis >= despesasLast ? '↑' : '↓', Math.abs(((despesasThis - despesasLast) / despesasLast) * 100).toFixed(1)) : t.finance.cards.noVariation}
          </p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.netProfit}</p>
          <p className={cn('font-data text-[26px] leading-none mb-2', lucroLiquido >= 0 ? 'text-sage-light' : 'text-error/70')}>{fmt(lucroLiquido)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.finance.cards.netProfitSub}</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.operatingMargin}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{margemOperacional.toFixed(0)}%</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">
            {t.finance.cards.operatingMarginSub(receitaLiquida > 0 ? ((despesasThis / receitaLiquida) * 100).toFixed(0) : '0')}
          </p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.receivable}</p>
          <p className="font-data text-[26px] text-sage-light leading-none mb-2">{fmt(aReceber)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.finance.cards.receivableSub(receivable.length)}</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.payable}</p>
          <p className="font-data text-[26px] text-error/80 leading-none mb-2">{fmt(aPagar)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.finance.cards.payableSub(unpaidExpenses.length)}</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.netRevenue}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(receitaLiquida)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.finance.cards.netRevenueSub(fmt(grossThis), fmt(discountsThis))}</p>
        </div>

        {/* Receita de produtos — categoria própria, separada da receita de serviços acima */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.finance.cards.productRevenue}</p>
          <p className="font-data text-[26px] text-gold leading-none mb-2">{fmt(productTotalThis)}</p>
          {productRevDiff !== null ? (
            <p className={cn('font-body font-light text-[9px] tracking-[0.12em]', productRevDiff >= 0 ? 'text-sage-light' : 'text-error/60')}>
              {t.finance.cards.vsLastMonth(productRevDiff >= 0 ? '↑' : '↓', Math.abs(productRevDiff).toFixed(1))}
            </p>
          ) : (
            <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.finance.cards.productRevenueSub}</p>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">{t.finance.insights.biggestExpense}</p>
          {maiorDespesa ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{maiorDespesa.description}</p>
              <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">{fmt(Number(maiorDespesa.amount))}</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">{t.finance.insights.noData}</p>}
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">{t.finance.insights.fastestGrowingCategory}</p>
          {categoriaQueMaisCresceu && categoriaQueMaisCresceu.diff > 0 ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{categoriaQueMaisCresceu.category}</p>
              <p className="font-body font-light text-[9px] text-error/60 tracking-[0.1em]">+{fmt(categoriaQueMaisCresceu.diff)}</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">{t.finance.insights.noGrowth}</p>}
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">{t.finance.insights.mostProfitableMonth}</p>
          {mesMaisLucrativo ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 capitalize">{mesMaisLucrativo.label}</p>
              <p className="font-body font-light text-[9px] text-sage-light tracking-[0.1em]">{fmt(mesMaisLucrativo.profit)}</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">{t.finance.insights.noData}</p>}
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/60 mb-3">{t.finance.insights.worstAging}</p>
          {piorAging ? (
            <>
              <p className="font-display font-light text-[17px] text-offwhite leading-tight mb-1 truncate">{piorAging.description}</p>
              <p className="font-body font-light text-[9px] text-error/60 tracking-[0.1em]">{t.finance.insights.daysOverdue(piorAging.daysOverdue)}</p>
            </>
          ) : <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">{t.finance.insights.noOverdue}</p>}
        </div>
      </div>

      {/* DRE Simplificado + DRE de Produtos, lado a lado — receita de
          produto fica em bloco próprio, nunca somada à de serviços acima */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 max-w-[440px] flex-1 min-w-[300px]">
          <p className="font-display font-light text-[17px] text-offwhite mb-1">{t.finance.dre.title}</p>
          <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mb-5">
            {t.finance.dre.subtitle(regime === 'caixa' ? t.finance.cash.toLowerCase() : t.finance.accrual.toLowerCase())}
          </p>
          <div className="space-y-[10px]">
            <div className="flex items-center justify-between">
              <span className="font-body font-light text-[11px] text-offwhite/60">{t.finance.dre.grossRevenue}</span>
              <span className="font-data text-[13px] text-sage-light">{fmt(grossThis)}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="font-body font-light text-[10px] text-offwhite/35">{t.finance.dre.discounts}</span>
              <span className="font-data text-[12px] text-error/60">− {fmt(discountsThis)}</span>
            </div>
            <div className="flex items-center justify-between pt-[6px] border-t border-offwhite/[0.07]">
              <span className="font-body font-light text-[11px] text-offwhite/70">{t.finance.dre.netRevenue}</span>
              <span className="font-data text-[13px] text-offwhite">{fmt(receitaLiquida)}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="font-body font-light text-[10px] text-offwhite/35">{t.finance.dre.expenses(regime === 'caixa' ? t.finance.cash.toLowerCase() : t.finance.accrual.toLowerCase())}</span>
              <span className="font-data text-[12px] text-error/60">− {fmt(despesasThis)}</span>
            </div>
            <div className="flex items-center justify-between pt-[10px] border-t border-offwhite/[0.14]">
              <span className="font-body font-medium text-[12px] text-offwhite">{t.finance.dre.result}</span>
              <span className={cn('font-data text-[16px]', lucroLiquido >= 0 ? 'text-sage-light' : 'text-error/70')}>{fmt(lucroLiquido)}</span>
            </div>
          </div>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 max-w-[440px] flex-1 min-w-[300px]">
          <p className="font-display font-light text-[17px] text-offwhite mb-1">{t.finance.dreProducts.title}</p>
          <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mb-5">
            {t.finance.dreProducts.subtitle}
          </p>
          <div className="space-y-[10px]">
            <div className="flex items-center justify-between">
              <span className="font-body font-light text-[11px] text-offwhite/60">{t.finance.dreProducts.subtotal}</span>
              <span className="font-data text-[13px] text-sage-light">{fmt(productSubtotalThis)}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="font-body font-light text-[10px] text-offwhite/35">{t.finance.dreProducts.discounts}</span>
              <span className="font-data text-[12px] text-error/60">− {fmt(productDiscountThis)}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="font-body font-light text-[10px] text-offwhite/35">{t.finance.dreProducts.shipping}</span>
              <span className="font-data text-[12px] text-sage-light">+ {fmt(productShippingThis)}</span>
            </div>
            <div className="flex items-center justify-between pt-[10px] border-t border-offwhite/[0.14]">
              <span className="font-body font-medium text-[12px] text-offwhite">{t.finance.dreProducts.total}</span>
              <span className="font-data text-[16px] text-gold">{fmt(productTotalThis)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <FinanceCharts
        monthlyTrend={monthlyTrend}
        dailyCashFlow={dailyCashFlow}
        hasCashMovement={hasCashMovement}
        categoryBreakdown={categoryBreakdown}
        fixedTotal={fixedTotal}
        variableTotal={variableTotal}
      />

      {/* Contas atrasadas (aging) */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          {t.finance.agingTitle}
        </h2>
        {!hasOverdue ? (
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-8 text-center">
            <p className="font-body font-light text-[12px] text-sage-light">{t.finance.noOverdueAccounts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {agingBuckets.map(b => (
              <div key={b.label} className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
                <p className="font-body font-light text-[8px] tracking-[0.2em] uppercase text-offwhite/30 mb-3">{b.label}</p>
                <p className={cn('font-data text-[22px] leading-none mb-1', b.count > 0 ? 'text-error/75' : 'text-offwhite/30')}>{fmt(b.total)}</p>
                <p className="font-body font-light text-[9px] text-offwhite/25">{t.finance.accountsCount(b.count)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Próximos vencimentos */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-1">
          {t.finance.upcomingTitle}
        </h2>
        <p className="font-body font-light text-[9px] text-offwhite/[0.22] tracking-[0.1em] mb-4">
          {t.finance.upcomingSub}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {upcomingBuckets.map(b => (
            <div key={b.days} className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
              <p className="font-body font-light text-[8px] tracking-[0.2em] uppercase text-offwhite/30 mb-4">{t.finance.nextDays(b.days)}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-light text-[10px] text-sage-light tracking-[0.1em] uppercase">{t.finance.receivableLabel}</span>
                <span className="font-data text-[14px] text-offwhite">{fmt(b.aReceber)}</span>
              </div>
              <p className="font-body font-light text-[8.5px] text-offwhite/25 mb-3">{t.finance.accountsParens(b.aReceberCount)}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-light text-[10px] text-error/70 tracking-[0.1em] uppercase">{t.finance.payableLabel}</span>
                <span className="font-data text-[14px] text-offwhite">{fmt(b.aPagar)}</span>
              </div>
              <p className="font-body font-light text-[8.5px] text-offwhite/25">{t.finance.accountsParens(b.aPagarCount)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gestão de despesas */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          {t.finance.expensesSection}
        </h2>
        <div className="space-y-4">
          <ExpenseForm />
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-2">
              {t.finance.recentEntries}
            </p>
            <ExpenseList expenses={expenseRows} />
          </div>
        </div>
      </section>
    </div>
  )
}
