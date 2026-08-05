'use client'

import { useTranslation } from '@/lib/i18n/LanguageProvider'

interface MonthPoint   { label: string; gross: number }
interface WeekdayPoint { weekday: number; label: string; avg: number }
interface DayPoint     { label: string; revenue: number }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function RevenueTrendCharts({
  monthlyTrend,
  weekdayAverages,
  dailyThisMonth,
}: {
  monthlyTrend: MonthPoint[]
  weekdayAverages: WeekdayPoint[]
  dailyThisMonth: DayPoint[]
}) {
  const { t } = useTranslation()
  const maxMonth = Math.max(...monthlyTrend.map(m => m.gross), 1)
  const maxWeekday = Math.max(...weekdayAverages.map(w => w.avg), 1)
  const maxDay = Math.max(...dailyThisMonth.map(d => d.revenue), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Tendência de receita — 6 meses */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-6">
          {t.billing.charts.revenueTrendTitle}
        </p>
        <div className="flex items-end gap-[10px] h-[140px]">
          {monthlyTrend.map((m, i) => {
            const pct = (m.gross / maxMonth) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="font-body font-light text-[8px] text-offwhite/55 leading-none">
                  {m.gross > 0 ? fmt(m.gross) : ''}
                </span>
                <div className="w-full relative" style={{ height: `${Math.max(pct, 3)}%` }}>
                  <div className={m.gross > 0 ? 'w-full h-full bg-gold/40 border-t border-gold/60 transition-all duration-500' : 'w-full h-full bg-offwhite/5'} />
                </div>
                <span className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.08em] capitalize">
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Receita por dia da semana */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">
          {t.billing.charts.revenueByWeekdayTitle}
        </p>
        <p className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.1em] mb-5">
          {t.billing.charts.avgPerOccurrence}
        </p>
        <div className="flex items-end gap-[10px] h-[110px]">
          {weekdayAverages.map((w, i) => {
            const pct = (w.avg / maxWeekday) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="font-body font-light text-[7.5px] text-offwhite/55 leading-none">
                  {w.avg > 0 ? fmt(w.avg) : ''}
                </span>
                <div className="w-full relative" style={{ height: `${Math.max(pct, 3)}%` }}>
                  <div className={w.avg > 0 ? 'w-full h-full bg-sage/35 border-t border-sage/55 transition-all duration-500' : 'w-full h-full bg-offwhite/5'} />
                </div>
                <span className="font-body font-light text-[8px] text-offwhite/55 tracking-[0.08em]">
                  {w.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Receita dia a dia do mês */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 lg:col-span-2">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-6">
          {t.billing.charts.dailyRevenueTitle}
        </p>
        <div className="flex items-end gap-[3px] h-[100px] overflow-x-auto">
          {dailyThisMonth.map((d, i) => {
            const pct = (d.revenue / maxDay) * 100
            return (
              <div key={i} className="flex-1 min-w-[10px] flex flex-col items-center gap-1 h-full justify-end" title={t.billing.charts.dayTooltip(d.label, fmt(d.revenue))}>
                <div className="w-full relative" style={{ height: `${Math.max(pct, 2)}%` }}>
                  <div className={d.revenue > 0 ? 'w-full h-full bg-gold/45 transition-all duration-500' : 'w-full h-full bg-offwhite/5'} />
                </div>
                <span className="font-body font-light text-[6.5px] text-offwhite/55">
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
