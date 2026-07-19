'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addMonths, subMonths, startOfMonth, getDay, getDaysInMonth, isSameDay, isToday as isDateToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function MonthGrid({
  monthDate,
  selected,
  onSelectDay,
}: {
  monthDate: Date
  selected: Date
  onSelectDay: (d: Date) => void
}) {
  const daysInMonth = getDaysInMonth(monthDate)
  const firstDow = getDay(startOfMonth(monthDate))
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(monthDate.getFullYear(), monthDate.getMonth(), i + 1))
  const leading = Array.from({ length: firstDow }, () => null)

  return (
    <div>
      <p className="font-body font-light text-[10px] tracking-[0.1em] text-offwhite/60 capitalize mb-[8px]">
        {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
      </p>
      <div className="grid grid-cols-7 gap-y-[2px]">
        {WEEKDAY.map((w, i) => (
          <span key={i} className="font-body font-light text-[8px] text-offwhite/25 text-center py-[2px]">{w}</span>
        ))}
        {leading.map((_, i) => <span key={`l${i}`} />)}
        {days.map(d => {
          const today = isDateToday(d)
          const isSelected = isSameDay(d, selected)
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={cn(
                'w-full aspect-square flex items-center justify-center font-data text-[10px] transition-colors duration-150 rounded-none',
                isSelected ? 'bg-gold text-charcoal-deep' : today ? 'text-gold' : 'text-offwhite/60 hover:bg-offwhite/8',
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MiniCalendarBody({
  selectedDate,
  view,
  onNavigate,
}: {
  selectedDate: Date
  view: string
  onNavigate?: () => void
}) {
  const router = useRouter()
  const [viewingMonth, setViewingMonth] = useState(() => startOfMonth(selectedDate))

  const goToDay = (d: Date) => {
    onNavigate?.()
    router.push(`/admin/agenda?view=${view}&date=${format(d, 'yyyy-MM-dd')}`)
  }

  return (
    <div className="w-[220px] shrink-0 bg-charcoal border border-offwhite/10 p-[16px]">
      <div className="flex items-center justify-between mb-[14px]">
        <span className="font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/30">Calendário</span>
        <div className="flex gap-1">
          <button
            onClick={() => setViewingMonth(m => subMonths(m, 1))}
            aria-label="Mês anterior"
            className="w-6 h-6 flex items-center justify-center text-offwhite/35 hover:text-gold transition-colors"
          >‹</button>
          <button
            onClick={() => setViewingMonth(m => addMonths(m, 1))}
            aria-label="Próximo mês"
            className="w-6 h-6 flex items-center justify-center text-offwhite/35 hover:text-gold transition-colors"
          >›</button>
        </div>
      </div>
      <div className="space-y-[20px]">
        <MonthGrid monthDate={viewingMonth} selected={selectedDate} onSelectDay={goToDay} />
        <MonthGrid monthDate={addMonths(viewingMonth, 1)} selected={selectedDate} onSelectDay={goToDay} />
      </div>
    </div>
  )
}

export function AgendaMiniCalendar({ selectedDate, view }: { selectedDate: string; view: string }) {
  const dateObj = new Date(`${selectedDate}T00:00:00`)
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden md:block">
        <MiniCalendarBody selectedDate={dateObj} view={view} />
      </div>

      {/* Mobile: compact button opening a popover */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="px-3 h-[36px] border border-offwhite/14 font-body font-light text-[10px] text-offwhite/60 flex items-center gap-2 hover:border-gold/40 transition-colors"
        >
          <span className="capitalize">{format(dateObj, "d 'de' MMM", { locale: ptBR })}</span>
          <span aria-hidden="true">📅</span>
        </button>
        {open && (
          <div className="fixed inset-0 z-40 flex items-start justify-center pt-[80px] bg-charcoal-deep/70" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
            <MiniCalendarBody selectedDate={dateObj} view={view} onNavigate={() => setOpen(false)} />
          </div>
        )}
      </div>
    </>
  )
}
