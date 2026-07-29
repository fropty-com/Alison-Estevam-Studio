'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths, startOfMonth, getDay, getDaysInMonth, isSameDay, isToday as isDateToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="12" height="11" stroke="currentColor" strokeWidth="1.1" />
      <line x1="1.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="1.1" />
      <line x1="4" y1="1" x2="4" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function AgendaDatePicker({ selectedDate, view }: { selectedDate: string; view: string }) {
  const router = useRouter()
  const dateObj = new Date(`${selectedDate}T00:00:00`)
  const [open, setOpen] = useState(false)
  const [viewingMonth, setViewingMonth] = useState(() => startOfMonth(dateObj))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setViewingMonth(startOfMonth(dateObj))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const goToDay = (d: Date) => {
    setOpen(false)
    router.push(`/admin/agenda?view=${view}&date=${format(d, 'yyyy-MM-dd')}`)
  }

  const daysInMonth = getDaysInMonth(viewingMonth)
  const firstDow = getDay(startOfMonth(viewingMonth))
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(viewingMonth.getFullYear(), viewingMonth.getMonth(), i + 1))
  const leading = Array.from({ length: firstDow }, () => null)

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Escolher data"
        className="w-[36px] h-[36px] border border-offwhite/[0.14] text-offwhite/55 flex items-center justify-center hover:border-gold/50 hover:text-gold transition-all duration-200"
      >
        <CalendarIcon />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[240px] bg-charcoal border border-offwhite/[0.14] p-[16px]">
          <div className="flex items-center justify-between mb-[12px]">
            <p className="font-body font-light text-[10px] tracking-[0.1em] text-offwhite/60 capitalize">
              {format(viewingMonth, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setViewingMonth(m => subMonths(m, 1))} aria-label="Mês anterior" className="w-6 h-6 flex items-center justify-center text-offwhite/35 hover:text-gold transition-colors">‹</button>
              <button onClick={() => setViewingMonth(m => addMonths(m, 1))} aria-label="Próximo mês" className="w-6 h-6 flex items-center justify-center text-offwhite/35 hover:text-gold transition-colors">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-[2px]">
            {WEEKDAY.map((w, i) => (
              <span key={i} className="font-body font-light text-[8px] text-offwhite/25 text-center py-[2px]">{w}</span>
            ))}
            {leading.map((_, i) => <span key={`l${i}`} />)}
            {days.map(d => {
              const today = isDateToday(d)
              const isSelected = isSameDay(d, dateObj)
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => goToDay(d)}
                  className={cn(
                    'w-full aspect-square flex items-center justify-center font-data text-[10px] transition-colors duration-150',
                    isSelected ? 'bg-gold text-charcoal-deep' : today ? 'text-gold' : 'text-offwhite/60 hover:bg-offwhite/5',
                  )}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
