import { format, getDay, getDaysInMonth, isBefore, startOfDay, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { BOOKING } from '@/config/booking'

export interface CalendarSlot {
  id: string
  startTime: string
  available: boolean
}

export interface DayAvailability {
  available: boolean
  slots: CalendarSlot[]
}

export type AvailabilityMap = Record<string, DayAvailability>

/**
 * The single calendar used everywhere a client picks a date — booking,
 * rescheduling. Kept as one component so the two flows can never visually
 * drift apart again.
 */
export function MiniCalendar({
  current,
  selected,
  availability,
  loading,
  onSelectDay,
  onChangeMonth,
}: {
  current:       Date
  selected:      Date | null
  availability:  AvailabilityMap
  loading:       boolean
  onSelectDay:   (date: Date) => void
  onChangeMonth: (dir: 1 | -1) => void
}) {
  const today      = startOfDay(new Date())
  const daysInM    = getDaysInMonth(current)
  const firstDow   = getDay(startOfMonth(current))
  const isCurrentM = current.getFullYear() === today.getFullYear() && current.getMonth() === today.getMonth()

  const days = Array.from({ length: daysInM }, (_, i) => {
    const d       = new Date(current.getFullYear(), current.getMonth(), i + 1)
    const dateStr = format(d, 'yyyy-MM-dd')
    const past    = isBefore(d, today)
    const info    = availability[dateStr]
    const unavailable = !past && (info !== undefined ? !info.available : BOOKING.blockedWeekdays.includes(d.getDay()))
    const disabled    = past || unavailable
    return { day: i + 1, date: d, dateStr, past, unavailable, disabled }
  })

  return (
    <div className="bg-offwhite/5 border border-offwhite/10 p-[26px] rounded-none">
      <div className="flex justify-between items-center mb-[18px]">
        <span className="font-display font-light text-xl text-offwhite tracking-[0.07em]" aria-live="polite">
          {format(current, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onChangeMonth(-1)}
            disabled={isCurrentM}
            aria-label="Mês anterior"
            className={cn(
              'w-7 h-7 border border-offwhite/10 text-offwhite/32 text-[13px]',
              'flex items-center justify-center transition-all duration-200',
              'hover:border-gold hover:text-gold hover:bg-gold/7',
              'disabled:opacity-20 disabled:pointer-events-none'
            )}
          >‹</button>
          <button
            onClick={() => onChangeMonth(1)}
            aria-label="Próximo mês"
            className={cn(
              'w-7 h-7 border border-offwhite/10 text-offwhite/32 text-[13px]',
              'flex items-center justify-center transition-all duration-200',
              'hover:border-gold hover:text-gold hover:bg-gold/7'
            )}
          >›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[3px] mb-[5px]" aria-hidden="true">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <span key={i} className="text-center font-body font-light text-[8.5px] tracking-[0.15em] uppercase text-offwhite/38 py-[5px]">
            {d}
          </span>
        ))}
      </div>

      <div className={cn('grid grid-cols-7 gap-[3px] transition-opacity duration-300', loading && 'opacity-40')} role="grid">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} aria-hidden="true" />)}
        {days.map(({ day, date, dateStr, past, unavailable, disabled }) => {
          const isSelected = selected && format(selected, 'yyyy-MM-dd') === dateStr
          const todayDay   = dateStr === format(today, 'yyyy-MM-dd')
          return (
            <div
              key={day}
              role="gridcell"
              aria-label={`${day} de ${format(current, 'MMMM', { locale: ptBR })}${past ? ' — passado' : unavailable ? ' — indisponível' : ''}`}
              aria-disabled={disabled}
              onClick={() => !disabled && onSelectDay(date)}
              className={cn(
                'aspect-square flex items-center justify-center relative rounded-full',
                'font-body font-light text-[11.5px]',
                'border border-transparent transition-all duration-200',
                past        && 'opacity-[0.18] pointer-events-none select-none',
                unavailable && 'opacity-[0.28] cursor-default select-none',
                !disabled   && 'text-offwhite/75 cursor-pointer hover:bg-gold/12 hover:text-gold hover:border-gold/30',
                todayDay    && !disabled && !isSelected && 'text-offwhite border-offwhite/30 font-normal',
                isSelected  && 'bg-gold text-charcoal-deep border-gold font-normal',
              )}
            >
              {day}
            </div>
          )
        })}
      </div>

      {loading && (
        <p className="text-center font-body font-light text-[8px] tracking-[0.24em] uppercase text-offwhite/22 mt-3">
          Verificando disponibilidade…
        </p>
      )}
    </div>
  )
}

/** The gold 3-column time grid for a selected day — renders nothing when the day has no available slots. */
export function SlotGrid({
  date,
  slots,
  selected,
  onSelect,
}: {
  date:      Date
  slots:     CalendarSlot[]
  selected:  CalendarSlot | null
  onSelect:  (slot: CalendarSlot) => void
}) {
  const available = slots.filter(s => s.available)
  if (available.length === 0) return null

  return (
    <div className="mt-[18px]">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-gold/70 mb-[10px]">
        {format(date, "d 'de' MMMM", { locale: ptBR })} — Horários
      </p>
      <div className="grid grid-cols-3 gap-[6px]">
        {available.map(slot => {
          const isSel = selected?.id === slot.id
          return (
            <div
              key={slot.id}
              role="listitem"
              aria-label={slot.startTime}
              onClick={() => onSelect(slot)}
              className={cn(
                'py-[13px] px-[6px] text-center',
                'font-data text-[15px]',
                'border rounded-none transition-all duration-200 select-none cursor-pointer',
                !isSel && 'text-offwhite/65 border-offwhite/14 hover:border-gold hover:text-gold hover:bg-gold/8',
                isSel && 'bg-gold border-gold text-charcoal-deep',
              )}
            >
              {slot.startTime}
            </div>
          )
        })}
      </div>
    </div>
  )
}
