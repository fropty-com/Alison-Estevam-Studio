'use client'

import { useState } from 'react'
import { BlockTimeModal } from './BlockTimeModal'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="2" y="5.5" width="8" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3.5 5.5V3.8a2.5 2.5 0 0 1 5 0V5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function BlockTimeButton({
  date,
  gridStartMin,
  gridEndMin,
  hasRule,
}: {
  date: string
  gridStartMin: number
  gridEndMin: number
  hasRule: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        disabled={!hasRule}
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap flex items-center gap-[7px] px-4 h-[36px] border border-offwhite/[0.18] font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/55 transition-all duration-200 hover:border-offwhite/40 hover:text-offwhite disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <LockIcon />
        {t.agenda.blockTime.button}
      </button>
      {open && (
        <BlockTimeModal
          date={date}
          gridStartMin={gridStartMin}
          gridEndMin={gridEndMin}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
