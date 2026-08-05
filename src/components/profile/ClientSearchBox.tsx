'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

interface AppointmentHit {
  id: string
  referenceCode: string
  status: string
  serviceName: string
  date?: string
  startTime?: string
  paymentId?: string
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9.8" y1="9.8" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function ClientSearchBox() {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<AppointmentHit[]>([])
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setHits([]); setLoading(false); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/client/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setHits(data.appointments ?? [])
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const showPanel = open && query.trim().length >= 2

  const goToAppointment = (a: AppointmentHit) => {
    setOpen(false)
    setQuery('')
    router.push(a.paymentId ? `/perfil/pagamentos/${a.paymentId}` : '/conta')
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-[220px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/55 pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={t.client.searchPlaceholder}
        className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-[12px] pl-[32px] pr-3 py-[8px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55"
      />

      {showPanel && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[300px] bg-charcoal border border-offwhite/[0.14] py-2 max-h-[360px] overflow-y-auto">
          {loading && (
            <p className="px-4 py-3 font-body font-light text-[11px] text-offwhite/55 italic">{t.topbar.searching}</p>
          )}

          {!loading && hits.length === 0 && (
            <p className="px-4 py-3 font-body font-light text-[11px] text-offwhite/55 italic">{t.client.noResults(query.trim())}</p>
          )}

          {!loading && hits.map(a => (
            <button
              key={a.id}
              onClick={() => goToAppointment(a)}
              className="w-full text-left px-4 py-[9px] hover:bg-offwhite/5 transition-colors"
            >
              <p className="font-body font-light text-[11.5px] text-offwhite/80 truncate">{a.serviceName}</p>
              <p className="font-data text-[9.5px] text-offwhite/55 mt-[1px]">
                {a.date && <>{format(parseISO(a.date), "d MMM", { locale: ptBR })}</>}
                {' · '}{t.dashboard.status[a.status as keyof typeof t.dashboard.status] ?? a.status}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
