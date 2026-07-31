'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

interface ClientResult {
  id: string
  name: string
  whatsapp: string
  email: string | null
}

interface AppointmentResult {
  id: string
  referenceCode: string
  status: string
  clientName: string
  serviceName: string
  date?: string
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9.8" y1="9.8" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function AdminGlobalSearch() {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<ClientResult[]>([])
  const [appointments, setAppointments] = useState<AppointmentResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setClients([])
      setAppointments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setClients(data.clients ?? [])
          setAppointments(data.appointments ?? [])
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const hasResults = clients.length > 0 || appointments.length > 0
  const showPanel = open && query.trim().length >= 2

  const goToClient = (id: string) => {
    setOpen(false)
    setQuery('')
    router.push(`/admin/clientes/${id}`)
  }

  const goToAppointment = (a: AppointmentResult) => {
    setOpen(false)
    setQuery('')
    router.push(a.date ? `/admin/agenda?view=day&date=${a.date}` : '/admin/agenda')
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-[320px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/30 pointer-events-none">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={t.topbar.searchPlaceholder}
        className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-[12px] pl-[34px] pr-[52px] py-[8px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/25"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-[6px] py-[2px] font-body font-light text-[8.5px] tracking-[0.08em] text-offwhite/25 border border-offwhite/[0.12] pointer-events-none">
        ⌘K
      </kbd>

      {showPanel && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[360px] bg-charcoal border border-offwhite/[0.14] py-2 max-h-[420px] overflow-y-auto">
          {loading && (
            <p className="px-4 py-3 font-body font-light text-[11px] text-offwhite/35 italic">{t.topbar.searching}</p>
          )}

          {!loading && !hasResults && (
            <p className="px-4 py-3 font-body font-light text-[11px] text-offwhite/35 italic">{t.topbar.noResults(query.trim())}</p>
          )}

          {!loading && clients.length > 0 && (
            <div className="mb-1">
              <p className="px-4 pb-2 font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/30">
                {t.topbar.clients}
              </p>
              {clients.map(c => (
                <button
                  key={c.id}
                  onClick={() => goToClient(c.id)}
                  className="w-full text-left px-4 py-[9px] hover:bg-offwhite/5 transition-colors"
                >
                  <p className="font-body font-light text-[11.5px] text-offwhite/80 truncate">{c.name}</p>
                  <p className="font-data text-[9.5px] text-offwhite/35 mt-[1px]">{c.whatsapp}</p>
                </button>
              ))}
            </div>
          )}

          {!loading && appointments.length > 0 && (
            <div className={clients.length > 0 ? 'pt-2 border-t border-offwhite/[0.06]' : ''}>
              <p className="px-4 pb-2 font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/30">
                {t.topbar.appointments}
              </p>
              {appointments.map(a => (
                <button
                  key={a.id}
                  onClick={() => goToAppointment(a)}
                  className="w-full text-left px-4 py-[9px] hover:bg-offwhite/5 transition-colors"
                >
                  <p className="font-body font-light text-[11.5px] text-offwhite/80 truncate">
                    {a.clientName} · {a.serviceName}
                  </p>
                  <p className="font-data text-[9.5px] text-offwhite/35 mt-[1px]">
                    {a.referenceCode}
                    {a.date && <> · {format(parseISO(a.date), "d MMM", { locale: ptBR })}</>}
                    {' · '}{t.dashboard.status[a.status as keyof typeof t.dashboard.status] ?? a.status}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
