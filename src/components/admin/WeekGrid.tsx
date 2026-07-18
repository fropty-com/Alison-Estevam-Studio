'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { minutesToPx, layoutColumns } from '@/lib/schedule/dayGridLayout'
import { useHalfHourMarks, useNowMinutes, STATUS_BLOCK, type GridAppointment } from './DayGrid'
import { AppointmentDetailSheet } from './AppointmentDetailSheet'

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
  const [selected, setSelected] = useState<GridAppointment | null>(null)
  const marks = useHalfHourMarks(gridStartMin, gridEndMin)
  const totalHeight = minutesToPx(gridEndMin - gridStartMin)
  const todayDate = days.find(d => d.isToday)?.date
  const nowMin = useNowMinutes(!!todayDate)

  const layouts = useMemo(
    () => days.map(d => layoutColumns(d.appointments.map(a => ({ id: a.id, startMin: a.startMin, endMin: a.endMin })))),
    [days],
  )

  return (
    <div className="border border-offwhite/10 overflow-x-auto">
      {/* Day headers */}
      <div className="flex sticky top-0 z-20 bg-charcoal border-b border-offwhite/10 min-w-[640px]">
        <div className="w-[52px] shrink-0 border-r border-offwhite/8" />
        {days.map(d => (
          <div
            key={d.date}
            className={cn(
              'flex-1 min-w-[110px] px-2 py-2 border-r border-offwhite/6 last:border-r-0',
              d.isToday && 'bg-gold/8',
              !d.isToday && d.isWeekendClosed && 'bg-offwhite/3'
            )}
          >
            <p className="font-body font-light text-[7.5px] tracking-[0.2em] uppercase text-offwhite/30 capitalize">{d.label}</p>
            <p className={cn('font-data text-[15px] leading-none mt-1', d.isToday ? 'text-gold' : 'text-offwhite/65')}>
              {d.dayNumber}
            </p>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="flex min-w-[640px]" style={{ height: totalHeight }}>
        {/* Hour ruler */}
        <div className="relative w-[52px] shrink-0 border-r border-offwhite/8">
          {marks.map(({ min, isHour }) => (
            <span
              key={min}
              className={cn(
                'absolute right-2 -translate-y-1/2 font-body font-light tracking-[0.05em]',
                isHour ? 'text-[8px] text-offwhite/32' : 'text-[7px] text-offwhite/16'
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
              className={cn(
                'relative flex-1 min-w-[110px] border-r border-offwhite/6 last:border-r-0',
                !d.isToday && d.isWeekendClosed && 'bg-offwhite/2'
              )}
            >
              {marks.map(({ min, isHour }) => (
                <div
                  key={min}
                  className={cn('absolute inset-x-0', isHour ? 'border-t border-offwhite/8' : 'border-t border-dotted border-offwhite/6')}
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
                  <p className="font-body font-light text-[9px] text-offwhite/25 italic">Folga</p>
                </div>
              ) : (
                d.appointments.map(a => {
                  const pos = layout.get(a.id) ?? { col: 0, cols: 1 }
                  const top = minutesToPx(a.startMin - gridStartMin)
                  const height = Math.max(minutesToPx(a.endMin - a.startMin), 20)
                  const widthPct = 100 / pos.cols
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className={cn(
                        'absolute px-[6px] py-[2px] border-l-[3px] border-y border-r text-left overflow-hidden transition-all duration-150',
                        'hover:brightness-125',
                        STATUS_BLOCK[a.status] ?? STATUS_BLOCK.pending,
                      )}
                      style={{
                        top,
                        height,
                        left: `${pos.col * widthPct}%`,
                        width: `calc(${widthPct}% - 2px)`,
                      }}
                    >
                      <p className="font-data text-[9px] leading-tight truncate">{a.timeLabel}</p>
                      <p className="font-body font-light text-[9px] leading-tight truncate">{a.clientName}</p>
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
