'use client'

import { useEffect, useRef, useState } from 'react'
import { LOCALES, LOCALE_LABEL } from '@/lib/i18n/locales'
import { useLocale, useTranslation } from '@/lib/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" />
      <ellipse cx="7.5" cy="7.5" rx="2.6" ry="6" stroke="currentColor" strokeWidth="1.1" />
      <line x1="1.5" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2 5 8.7l4.5-5.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LanguageSelector() {
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t.topbar.language}
        className="w-[36px] h-[36px] flex items-center justify-center text-offwhite/55 hover:bg-offwhite/5 hover:text-gold/80 transition-all duration-200"
      >
        <GlobeIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[160px] bg-charcoal border border-offwhite/[0.14] py-2">
          <p className="px-4 pb-2 font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/55 border-b border-offwhite/[0.06]">
            {t.topbar.language}
          </p>
          {LOCALES.map(l => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-[9px] font-body font-light text-[11px] transition-colors',
                l === locale ? 'text-gold' : 'text-offwhite/60 hover:bg-offwhite/5 hover:text-offwhite'
              )}
            >
              {LOCALE_LABEL[l]}
              {l === locale && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
