'use client'

interface MonthPoint { label: string; revenue: number; expenses: number; profit: number }
interface DayPoint   { label: string; in: number; out: number }
interface CategoryPoint { category: string; total: number }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-[6px] font-body font-light text-[9px] text-offwhite/40 tracking-[0.08em]">
      <span className={`w-[6px] h-[6px] rounded-full ${color}`} />
      {label}
    </span>
  )
}

export function FinanceCharts({
  monthlyTrend,
  dailyCashFlow,
  hasCashMovement,
  categoryBreakdown,
  fixedTotal,
  variableTotal,
}: {
  monthlyTrend: MonthPoint[]
  dailyCashFlow: DayPoint[]
  hasCashMovement: boolean
  categoryBreakdown: CategoryPoint[]
  fixedTotal: number
  variableTotal: number
}) {
  const maxTrend = Math.max(...monthlyTrend.flatMap(m => [m.revenue, m.expenses, Math.abs(m.profit)]), 1)
  const maxDay = Math.max(...dailyCashFlow.flatMap(d => [d.in, d.out]), 1)
  const maxCategory = Math.max(...categoryBreakdown.map(c => c.total), 1)
  const fixedVariableTotal = fixedTotal + variableTotal

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Tendência 6 meses */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 lg:col-span-2">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35">
            Tendência 6 meses
          </p>
          <div className="flex gap-4">
            <LegendDot color="bg-sage" label="Receita" />
            <LegendDot color="bg-error" label="Despesas" />
            <LegendDot color="bg-gold" label="Lucro" />
          </div>
        </div>
        <div className="flex items-end gap-[16px] h-[150px]">
          {monthlyTrend.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex items-end gap-[3px] w-full justify-center h-full">
                <div className="w-[8px] relative h-full flex items-end">
                  <div className="w-full bg-sage/50 transition-all duration-500" style={{ height: `${Math.max((m.revenue / maxTrend) * 100, 2)}%` }} />
                </div>
                <div className="w-[8px] relative h-full flex items-end">
                  <div className="w-full bg-error/50 transition-all duration-500" style={{ height: `${Math.max((m.expenses / maxTrend) * 100, 2)}%` }} />
                </div>
                <div className="w-[8px] relative h-full flex items-end">
                  <div className={`w-full transition-all duration-500 ${m.profit >= 0 ? 'bg-gold/60' : 'bg-error/70'}`} style={{ height: `${Math.max((Math.abs(m.profit) / maxTrend) * 100, 2)}%` }} />
                </div>
              </div>
              <span className="font-body font-light text-[8px] text-offwhite/25 tracking-[0.08em] capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fluxo de caixa diário */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 lg:col-span-2">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35">
            Fluxo de caixa diário
          </p>
          <div className="flex gap-4">
            <LegendDot color="bg-sage" label="Entradas" />
            <LegendDot color="bg-error" label="Saídas (pagas)" />
          </div>
        </div>
        {!hasCashMovement ? (
          <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-8">
            Sem movimentação de caixa deste mês.
          </p>
        ) : (
          <div className="flex items-end gap-[3px] h-[100px] overflow-x-auto">
            {dailyCashFlow.map((d, i) => (
              <div key={i} className="flex-1 min-w-[10px] flex flex-col items-center gap-1 h-full justify-end" title={`Dia ${d.label}: +${fmt(d.in)} / -${fmt(d.out)}`}>
                <div className="flex items-end gap-[1px] w-full h-full justify-center">
                  <div className="w-1/2 relative h-full flex items-end">
                    <div className="w-full bg-sage/50" style={{ height: `${Math.max((d.in / maxDay) * 100, d.in > 0 ? 2 : 0)}%` }} />
                  </div>
                  <div className="w-1/2 relative h-full flex items-end">
                    <div className="w-full bg-error/50" style={{ height: `${Math.max((d.out / maxDay) * 100, d.out > 0 ? 2 : 0)}%` }} />
                  </div>
                </div>
                <span className="font-body font-light text-[6.5px] text-offwhite/[0.22]">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Despesas por categoria */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-6">
          Despesas por categoria
        </p>
        {categoryBreakdown.length === 0 ? (
          <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem despesas deste mês.</p>
        ) : (
          <div className="space-y-[14px]">
            {categoryBreakdown.map(c => {
              const pct = (c.total / maxCategory) * 100
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{c.category}</span>
                    <span className="font-data text-[12px] text-offwhite/55">{fmt(c.total)}</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-error/40 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Fixas vs Variáveis */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-6">
          Fixas vs Variáveis
        </p>
        {fixedVariableTotal === 0 ? (
          <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic">Sem despesas para classificar.</p>
        ) : (
          <div className="space-y-[14px]">
            <div>
              <div className="flex items-center justify-between mb-[5px]">
                <span className="font-body font-light text-[11px] text-offwhite/70">Fixas</span>
                <span className="font-data text-[12px] text-offwhite/55">
                  {fmt(fixedTotal)} <span className="text-offwhite/30">({((fixedTotal / fixedVariableTotal) * 100).toFixed(0)}%)</span>
                </span>
              </div>
              <div className="w-full h-[3px] bg-offwhite/5">
                <div className="h-full bg-gold/45" style={{ width: `${(fixedTotal / fixedVariableTotal) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-[5px]">
                <span className="font-body font-light text-[11px] text-offwhite/70">Variáveis</span>
                <span className="font-data text-[12px] text-offwhite/55">
                  {fmt(variableTotal)} <span className="text-offwhite/30">({((variableTotal / fixedVariableTotal) * 100).toFixed(0)}%)</span>
                </span>
              </div>
              <div className="w-full h-[3px] bg-offwhite/5">
                <div className="h-full bg-sage/45" style={{ width: `${(variableTotal / fixedVariableTotal) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
