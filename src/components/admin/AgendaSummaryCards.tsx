'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M1.5 7.5S4 3 7.5 3s6 4.5 6 4.5-2.5 4.5-6 4.5-6-4.5-6-4.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <line x1="2" y1="13" x2="13" y2="2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1.5 7.5S4 3 7.5 3s6 4.5 6 4.5-2.5 4.5-6 4.5-6-4.5-6-4.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function AgendaSummaryCards({
  totalCount,
  openCount,
  completedCount,
  revenueLabel,
  revenueValue,
}: {
  totalCount: number
  openCount: number
  completedCount: number
  revenueLabel: string
  revenueValue: number
}) {
  const { t } = useTranslation()
  const [revenueHidden, setRevenueHidden] = useState(false)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="bg-gold px-5 py-4 flex flex-col justify-between min-h-[86px]">
        <div className="flex items-center justify-between">
          <p className="font-body font-medium text-[9px] tracking-[0.14em] text-charcoal-deep/70">{t.agenda.summary.appointments}</p>
          <span className="text-charcoal-deep/60 text-[13px]" aria-hidden="true">↗</span>
        </div>
        <p className="font-data text-[26px] text-charcoal-deep leading-none">{totalCount}</p>
      </div>

      <div className="border border-offwhite/[0.14] px-5 py-4 flex flex-col justify-between min-h-[86px]">
        <div className="flex items-center justify-between">
          <p className="font-body font-light text-[9px] tracking-[0.14em] text-offwhite/45">{t.agenda.summary.open}</p>
          <span className="text-offwhite/30 text-[13px]" aria-hidden="true">↗</span>
        </div>
        <p className="font-data text-[26px] text-offwhite leading-none">{openCount}</p>
      </div>

      <div className="border border-offwhite/[0.14] px-5 py-4 flex flex-col justify-between min-h-[86px]">
        <div className="flex items-center justify-between">
          <p className="font-body font-light text-[9px] tracking-[0.14em] text-offwhite/45">{t.agenda.summary.completed}</p>
          <span className="text-offwhite/30 text-[13px]" aria-hidden="true">↗</span>
        </div>
        <p className="font-data text-[26px] text-offwhite leading-none">{completedCount}</p>
      </div>

      <div className="border border-offwhite/[0.14] px-5 py-4 flex flex-col justify-between min-h-[86px]">
        <div className="flex items-center justify-between">
          <p className="font-body font-light text-[9px] tracking-[0.14em] text-offwhite/45">{revenueLabel}</p>
          <button
            type="button"
            onClick={() => setRevenueHidden(v => !v)}
            aria-label={revenueHidden ? t.agenda.summary.showValue : t.agenda.summary.hideValue}
            className="text-offwhite/30 hover:text-offwhite/60 transition-colors"
          >
            <EyeIcon hidden={revenueHidden} />
          </button>
        </div>
        <p className={cn('font-data text-[26px] text-offwhite leading-none', revenueHidden && 'blur-[6px] select-none')}>
          {formatCurrency(revenueValue)}
        </p>
      </div>
    </div>
  )
}
