'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export interface UpcomingItem {
  id: string
  serviceName: string
  date?: string
  startTime?: string
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8c-2 0-3.5 1.6-3.5 3.6v2c0 .5-.2 1-.6 1.4L3 9.9c-.4.4-.1 1.1.5 1.1h9c.6 0 .9-.7.5-1.1l-.9-1.1c-.4-.4-.6-.9-.6-1.4v-2c0-2-1.5-3.6-3.5-3.6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M6.3 12.4c.3.7 1 1.1 1.7 1.1s1.4-.4 1.7-1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function ClientNotificationsBell({ upcoming }: { upcoming: UpcomingItem[] }) {
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
        aria-label={t.topbar.notifications}
        className="relative w-[36px] h-[36px] flex items-center justify-center text-offwhite/40 hover:bg-offwhite/5 hover:text-gold/80 transition-all duration-200"
      >
        <BellIcon />
        {upcoming.length > 0 && (
          <span className="absolute -top-[5px] -right-[5px] min-w-[16px] h-[16px] px-[3px] flex items-center justify-center bg-gold/20 border border-gold/40 text-gold/90 font-data text-[8px] leading-none">
            {upcoming.length > 9 ? '9+' : upcoming.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[260px] bg-charcoal border border-offwhite/[0.14] py-2">
          <p className="px-4 pb-2 font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/30 border-b border-offwhite/[0.06]">
            {t.topbar.pendingAppointments}
          </p>
          {upcoming.length === 0 ? (
            <p className="px-4 py-4 font-body font-light text-[11px] text-offwhite/35 italic">{t.topbar.nothingPending}</p>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {upcoming.map(u => (
                <Link
                  key={u.id}
                  href="/conta"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-[10px] hover:bg-offwhite/5 transition-colors border-b border-offwhite/4 last:border-0"
                >
                  <p className="font-body font-light text-[11px] text-offwhite/80 truncate">{u.serviceName}</p>
                  {u.date && u.startTime && (
                    <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.08em] mt-[2px]">
                      {format(parseISO(u.date), "d MMM", { locale: ptBR })} às {u.startTime}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
