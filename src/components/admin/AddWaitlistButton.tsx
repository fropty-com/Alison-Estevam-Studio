'use client'

import { useState } from 'react'
import { AddWaitlistModal } from './AddWaitlistModal'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="9.8" y1="9.8" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function AddWaitlistButton() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap flex items-center gap-[7px] px-4 h-[36px] bg-gold font-body font-medium text-[8px] tracking-[0.28em] uppercase text-charcoal-deep hover:bg-gold-light transition-all duration-200"
      >
        <SearchIcon />
        {t.waitlist.addClient}
      </button>
      {open && <AddWaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}
