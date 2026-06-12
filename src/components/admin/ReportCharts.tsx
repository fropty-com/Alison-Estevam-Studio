'use client'

import { cn } from '@/lib/utils'

interface WeeklyPoint { label: string; count: number }
interface SvcPoint    { name: string; count: number; revenue: number }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ReportCharts({
  weeklyData,
  svcRanking,
}: {
  weeklyData: WeeklyPoint[]
  svcRanking: SvcPoint[]
}) {
  const maxCount = Math.max(...weeklyData.map(w => w.count), 1)
  const maxSvc   = Math.max(...svcRanking.map(s => s.count), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Agendamentos por semana */}
      <div className="bg-offwhite/3 border border-offwhite/7 p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-6">
          Agendamentos — últimas 6 semanas
        </p>
        <div className="flex items-end gap-[10px] h-[140px]">
          {weeklyData.map((w, i) => {
            const pct = maxCount > 0 ? (w.count / maxCount) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="font-data text-[11px] text-offwhite/45 leading-none">
                  {w.count > 0 ? w.count : ''}
                </span>
                <div className="w-full relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                  <div
                    className={cn(
                      'w-full h-full transition-all duration-500',
                      w.count > 0 ? 'bg-sage/35 border-t border-sage/55' : 'bg-offwhite/6'
                    )}
                  />
                </div>
                <span className="font-body font-light text-[8px] text-offwhite/25 tracking-[0.08em]">
                  {w.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ranking de serviços */}
      <div className="bg-offwhite/3 border border-offwhite/7 p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-6">
          Serviços mais realizados — este mês
        </p>

        {svcRanking.length === 0 ? (
          <p className="font-body font-light text-[11px] text-offwhite/22 italic">
            Nenhum dado disponível.
          </p>
        ) : (
          <div className="space-y-[14px]">
            {svcRanking.map((s, i) => {
              const pct = (s.count / maxSvc) * 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">
                      {s.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em]">
                        {fmt(s.revenue)}
                      </span>
                      <span className="font-data text-[13px] text-offwhite/55 w-5 text-right">
                        {s.count}×
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/6 rounded-none">
                    <div
                      className="h-full bg-sage/40 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
