'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type AgendaView = 'day' | 'workweek' | 'week' | 'month'

const VIEWS: { key: AgendaView; label: string }[] = [
  { key: 'day',      label: 'Dia' },
  { key: 'workweek', label: 'Semana Útil' },
  { key: 'week',     label: 'Semana' },
  { key: 'month',    label: 'Mês' },
]

export function AgendaViewDropdown({ view, dateStr }: { view: AgendaView; dateStr: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = VIEWS.find(v => v.key === view) ?? VIEWS[0]

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
        className="px-4 h-9 border border-offwhite/10 font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/60 flex items-center gap-2 hover:border-gold/40 transition-all duration-200"
      >
        <span aria-hidden="true">🗓</span>
        {current.label}
        <span className={cn('transition-transform duration-150', open && 'rotate-180')}>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-[160px] bg-charcoal border border-offwhite/14 py-1">
          {VIEWS.map(v => (
            <Link
              key={v.key}
              href={`/admin/agenda?view=${v.key}&date=${dateStr}`}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-4 py-[9px] font-body font-light text-[9px] tracking-[0.2em] uppercase transition-colors',
                v.key === view ? 'text-gold bg-gold/8' : 'text-offwhite/55 hover:bg-offwhite/6 hover:text-offwhite'
              )}
            >
              {v.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
