'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { minutesToPx, HOUR_HEIGHT, layoutColumns } from '@/lib/schedule/dayGridLayout'
import { useHalfHourMarks, useNowMinutes, appointmentBlockStyle, type GridAppointment } from './DayGrid'
import { AppointmentDetailSheet } from './AppointmentDetailSheet'
import { rescheduleAppointmentAdmin } from '@/app/admin/actions'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

function minutesToHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function canDrag(status: string) {
  return status === 'pending' || status === 'confirmed'
}

export interface WeekDay {
  date: string
  label: string
  dayNumber: number
  isToday: boolean
  isWeekendClosed: boolean
  blockedAllDay: boolean
  appointments: GridAppointment[]
}

export function WeekGrid({
  days,
  gridStartMin,
  gridEndMin,
}: {
  days: WeekDay[]
  gridStartMin: number
  gridEndMin: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [selected, setSelected] = useState<GridAppointment | null>(null)
  const [, startTransition] = useTransition()
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const marks = useHalfHourMarks(gridStartMin, gridEndMin)
  const totalHeight = minutesToPx(gridEndMin - gridStartMin)
  const todayDate = days.find(d => d.isToday)?.date
  const nowMin = useNowMinutes(!!todayDate)

  const layouts = useMemo(
    () => days.map(d => layoutColumns(d.appointments.map(a => ({ id: a.id, startMin: a.startMin, endMin: a.endMin })))),
    [days],
  )

  const handleDragStart = (e: React.DragEvent, a: GridAppointment) => {
    if (!canDrag(a.status)) { e.preventDefault(); return }
    e.dataTransfer.setData('text/plain', a.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, dayDate: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(dayDate)
  }

  const handleDrop = (e: React.DragEvent, dayDate: string) => {
    e.preventDefault()
    setDragOverDate(null)
    const id = e.dataTransfer.getData('text/plain')
    const col = columnRefs.current[dayDate]
    if (!id || !col) return

    const rect = col.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutesFromTop = (y / HOUR_HEIGHT) * 60
    const rawMin = gridStartMin + minutesFromTop
    const snappedMin = Math.min(gridEndMin, Math.max(gridStartMin, Math.round(rawMin / 60) * 60))
    const newStartTime = minutesToHHMM(snappedMin)

    startTransition(async () => {
      const res = await rescheduleAppointmentAdmin(id, dayDate, newStartTime)
      if (res?.error) window.alert(res.error)
      router.refresh()
    })
  }

  return (
    <div className="border border-offwhite/10 overflow-x-auto">
      {/* Day headers */}
      <div className="flex sticky top-0 z-20 bg-charcoal border-b border-offwhite/10 min-w-[640px]">
        <div className="w-[52px] shrink-0 border-r border-offwhite/[0.08]" />
        {days.map(d => (
          <div
            key={d.date}
            className={cn(
              'flex-1 min-w-[110px] px-2 py-2 border-r border-offwhite/[0.06] last:border-r-0',
              d.isToday && 'bg-gold/10',
              !d.isToday && d.isWeekendClosed && 'bg-offwhite/5'
            )}
          >
            <p className="font-body font-light text-[7.5px] tracking-[0.2em] uppercase text-offwhite/55 capitalize">{d.label}</p>
            <p className={cn('font-data text-[15px] leading-none mt-1', d.isToday ? 'text-gold' : 'text-offwhite/65')}>
              {d.dayNumber}
            </p>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="flex min-w-[640px]" style={{ height: totalHeight }}>
        {/* Hour ruler */}
        <div className="relative w-[52px] shrink-0 border-r border-offwhite/[0.08]">
          {marks.map(({ min, isHour }) => (
            <span
              key={min}
              className={cn(
                'absolute right-2 -translate-y-1/2 font-body font-light tracking-[0.05em]',
                isHour ? 'text-[8px] text-offwhite/55' : 'text-[7px] text-offwhite/55'
              )}
              style={{ top: minutesToPx(min - gridStartMin) }}
            >
              {String(Math.floor(min / 60)).padStart(2, '0')}:{min % 60 === 0 ? '00' : '30'}
            </span>
          ))}
        </div>

        {days.map((d, i) => {
          const layout = layouts[i]
          return (
            <div
              key={d.date}
              ref={el => { columnRefs.current[d.date] = el }}
              className={cn(
                'relative flex-1 min-w-[110px] border-r border-offwhite/[0.06] last:border-r-0',
                d.isToday && 'bg-gold/5',
                !d.isToday && d.isWeekendClosed && 'bg-offwhite/5',
                dragOverDate === d.date && 'bg-gold/[0.06]'
              )}
              onDragOver={e => handleDragOver(e, d.date)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={e => handleDrop(e, d.date)}
            >
              {marks.map(({ min, isHour }) => (
                <div
                  key={min}
                  className={cn('absolute inset-x-0', isHour ? 'border-t border-offwhite/[0.08]' : 'border-t border-dotted border-offwhite/[0.06]')}
                  style={{ top: minutesToPx(min - gridStartMin) }}
                />
              ))}

              {d.isToday && nowMin !== null && nowMin >= gridStartMin && nowMin <= gridEndMin && (
                <div
                  className="absolute inset-x-0 z-10 flex items-center pointer-events-none"
                  style={{ top: minutesToPx(nowMin - gridStartMin) }}
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-gold -ml-[3px] shrink-0" />
                  <span className="flex-1 h-px bg-gold/70" />
                </div>
              )}

              {d.blockedAllDay ? (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(241,241,241,0.03),rgba(241,241,241,0.03)_8px,transparent_8px,transparent_16px)] flex items-center justify-center">
                  <p className="font-body font-light text-[9px] text-offwhite/55 italic">{t.agenda.dayOffShort}</p>
                </div>
              ) : (
                d.appointments.map(a => {
                  const pos = layout.get(a.id) ?? { col: 0, cols: 1 }
                  const top = minutesToPx(a.startMin - gridStartMin)
                  const height = Math.max(minutesToPx(a.endMin - a.startMin), 20)
                  const widthPct = 100 / pos.cols
                  const { style: blockStyle, textClass } = appointmentBlockStyle(a.status, a.serviceName)
                  const showService = height >= 44
                  return (
                    <button
                      key={a.id}
                      draggable={canDrag(a.status)}
                      onDragStart={e => handleDragStart(e, a)}
                      onClick={() => setSelected(a)}
                      title={canDrag(a.status) ? t.agenda.dragToReschedule : undefined}
                      className={cn(
                        'absolute px-[6px] py-[2px] border-l-[3px] border-y border-r text-left overflow-hidden transition-all duration-150',
                        'hover:brightness-125',
                        canDrag(a.status) && 'cursor-grab active:cursor-grabbing',
                        textClass,
                      )}
                      style={{
                        top,
                        height,
                        left: `${pos.col * widthPct}%`,
                        width: `calc(${widthPct}% - 2px)`,
                        ...blockStyle,
                      }}
                    >
                      <p className="font-data text-[9px] leading-tight truncate">{a.timeLabel}</p>
                      <p className="font-body font-light text-[9px] leading-tight truncate">{a.clientName}</p>
                      {showService && (
                        <p className="font-body font-light text-[8px] leading-tight truncate opacity-70">{a.serviceName}</p>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <AppointmentDetailSheet appt={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
