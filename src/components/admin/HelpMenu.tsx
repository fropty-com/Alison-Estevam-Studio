'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.8 5.8c0-1 .8-1.8 1.7-1.8s1.7.7 1.7 1.6c0 1.1-1.7 1.2-1.7 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="7.5" cy="10.8" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function HelpMenu() {
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

  const links = [
    { href: '/sobre', label: t.topbar.about },
    { href: '/termos', label: t.topbar.terms },
    { href: '/privacidade', label: t.topbar.privacy },
    { href: '/licencas', label: t.topbar.licenses },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t.topbar.help}
        className="w-[36px] h-[36px] flex items-center justify-center text-offwhite/55 hover:bg-offwhite/5 hover:text-gold/80 transition-all duration-200"
      >
        <HelpIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] bg-charcoal border border-offwhite/[0.14] py-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              target="_blank"
              onClick={() => setOpen(false)}
              className="block px-4 py-[9px] font-body font-light text-[10.5px] text-offwhite/60 hover:bg-offwhite/5 hover:text-offwhite transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
