'use client'

import { useTranslation } from '@/lib/i18n/LanguageProvider'

interface MonthPoint  { label: string; revenue: number }
interface CountPoint  { name: string; count: number }
interface StalePoint  { id: string; name: string; daysSince: number | null; neverUsed: boolean }
interface HourPoint   { name: string; perHour: number }
interface PairPoint   { pair: string; count: number }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function ServicoCharts({
  monthlyTrend,
  maisRealizados,
  menosRealizados,
  staleList,
  receitaPorHora,
  realizadosJuntos,
}: {
  monthlyTrend: MonthPoint[]
  maisRealizados: CountPoint[]
  menosRealizados: CountPoint[]
  staleList: StalePoint[]
  receitaPorHora: HourPoint[]
  realizadosJuntos: PairPoint[]
}) {
  const { t } = useTranslation()
  const maxTrend = Math.max(...monthlyTrend.map(m => m.revenue), 1)
  const maxMais  = Math.max(...maisRealizados.map(s => s.count), 1)
  const maxMenos = Math.max(...menosRealizados.map(s => s.count), 1)
  const maxHour  = Math.max(...receitaPorHora.map(s => s.perHour), 1)
  const maxPair  = Math.max(...realizadosJuntos.map(p => p.count), 1)

  return (
    <div className="space-y-6">
      {/* Tendência de receita de serviços */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">
          {t.services.charts.revenueTitle}
        </p>
        <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-5">{t.services.charts.last6Months}</p>
        <div className="flex items-end gap-[10px] h-[140px]">
          {monthlyTrend.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="font-body font-light text-[8px] text-offwhite/55 leading-none">
                {m.revenue > 0 ? fmt(m.revenue) : ''}
              </span>
              <div className="w-full relative" style={{ height: `${Math.max((m.revenue / maxTrend) * 100, 3)}%` }}>
                <div className={m.revenue > 0 ? 'w-full h-full bg-sage/45 border-t border-sage/60 transition-all duration-500' : 'w-full h-full bg-offwhite/5'} />
              </div>
              <span className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.08em] capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mais realizados */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.services.charts.mostPerformedTitle}</p>
          <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-6">{t.services.charts.rankingByCount}</p>
          {maisRealizados.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">{t.services.charts.noneThisMonth}</p>
          ) : (
            <div className="space-y-[12px]">
              {maisRealizados.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                    <span className="font-data text-[13px] text-offwhite/55">{s.count}×</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-sage/45 transition-all duration-500" style={{ width: `${(s.count / maxMais) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menos realizados */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.services.charts.leastPerformedTitle}</p>
          <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-6">{t.services.charts.lowestDemand}</p>
          {menosRealizados.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">{t.services.charts.noneThisMonth}</p>
          ) : (
            <div className="space-y-[12px]">
              {menosRealizados.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                    <span className="font-data text-[13px] text-offwhite/55">{s.count}×</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-error/40 transition-all duration-500" style={{ width: `${maxMenos > 0 ? (s.count / maxMenos) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Serviços parados */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.services.charts.staleTitle}</p>
        <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-6">{t.services.charts.staleSub}</p>
        {staleList.length === 0 ? (
          <p className="font-body font-light text-[12px] text-sage-light text-center py-6">{t.services.charts.allRecentlyPerformed}</p>
        ) : (
          <div className="divide-y divide-offwhite/6 -mx-6">
            {staleList.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-body font-light text-[12px] text-offwhite/70">{s.name}</span>
                <span className="font-body font-light text-[9px] text-error/60 tracking-[0.1em]">
                  {s.neverUsed ? t.services.insights.neverPerformed : t.services.insights.daysSinceNoPerformance(s.daysSince!)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por hora */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.services.charts.revenuePerHourTitle}</p>
          <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-6">{t.services.charts.efficiencySub}</p>
          {receitaPorHora.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">{t.services.charts.registerDuration}</p>
          ) : (
            <div className="space-y-[12px]">
              {receitaPorHora.slice(0, 6).map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                    <span className="font-data text-[12px] text-offwhite/55">{fmt(s.perHour)}</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-gold/45 transition-all duration-500" style={{ width: `${(s.perHour / maxHour) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Realizados juntos */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.services.charts.pairedTitle}</p>
          <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-6">{t.services.charts.pairedSub}</p>
          {realizadosJuntos.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">{t.services.charts.noPairsFound}</p>
          ) : (
            <div className="space-y-[12px]">
              {realizadosJuntos.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{p.pair}</span>
                    <span className="font-data text-[13px] text-offwhite/55">{p.count}×</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-sage/40 transition-all duration-500" style={{ width: `${(p.count / maxPair) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
