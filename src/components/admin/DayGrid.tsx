'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { minutesToPx, layoutColumns } from '@/lib/schedule/dayGridLayout'
import { AppointmentDetailSheet, type DetailAppointment } from './AppointmentDetailSheet'
import { unblockTimeRange } from '@/app/admin/actions'

export interface GridAppointment extends DetailAppointment {
  startMin: number
  endMin: number
}

export interface BlockedRange {
  startMin: number
  endMin: number
}

function minutesToHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export const STATUS_BLOCK: Record<string, string> = {
  pending:     'border-gold/60 text-gold-light bg-[repeating-linear-gradient(135deg,rgba(201,164,76,0.16),rgba(201,164,76,0.16)_6px,rgba(201,164,76,0.08)_6px,rgba(201,164,76,0.08)_12px)]',
  confirmed:   'border-sage/60 text-sage-light bg-[repeating-linear-gradient(135deg,rgba(122,158,122,0.16),rgba(122,158,122,0.16)_6px,rgba(122,158,122,0.08)_6px,rgba(122,158,122,0.08)_12px)]',
  checked_in:  'border-gold text-gold bg-[repeating-linear-gradient(135deg,rgba(201,164,76,0.3),rgba(201,164,76,0.3)_6px,rgba(201,164,76,0.18)_6px,rgba(201,164,76,0.18)_12px)]',
  in_progress: 'border-gold text-gold bg-[repeating-linear-gradient(135deg,rgba(201,164,76,0.3),rgba(201,164,76,0.3)_6px,rgba(201,164,76,0.18)_6px,rgba(201,164,76,0.18)_12px)]',
  completed:   'border-offwhite/30 text-offwhite/50 bg-[repeating-linear-gradient(135deg,rgba(241,241,241,0.07),rgba(241,241,241,0.07)_6px,rgba(241,241,241,0.03)_6px,rgba(241,241,241,0.03)_12px)]',
  cancelled:   'border-error/50 text-error/70 bg-[repeating-linear-gradient(135deg,rgba(214,90,90,0.14),rgba(214,90,90,0.14)_6px,rgba(214,90,90,0.06)_6px,rgba(214,90,90,0.06)_12px)]',
  no_show:     'border-error/40 text-error/55 bg-[repeating-linear-gradient(135deg,rgba(214,90,90,0.1),rgba(214,90,90,0.1)_6px,rgba(214,90,90,0.04)_6px,rgba(214,90,90,0.04)_12px)]',
}

const SWIPE_THRESHOLD_PX = 60

/** Half-hour hour ruler + gridlines shared by DayGrid and WeekGrid. */
export function useHalfHourMarks(gridStartMin: number, gridEndMin: number) {
  return useMemo(() => {
    const list: { min: number; isHour: boolean }[] = []
    for (let m = Math.ceil(gridStartMin / 30) * 30; m <= gridEndMin; m += 30) {
      list.push({ min: m, isHour: m % 60 === 0 })
    }
    return list
  }, [gridStartMin, gridEndMin])
}

/** Current-time indicator line — only meaningful when the rendered date is today. */
export function useNowMinutes(isToday: boolean): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (!isToday) { setNow(null); return }
    const update = () => {
      const d = new Date()
      setNow(d.getHours() * 60 + d.getMinutes())
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [isToday])
  return now
}

export function DayGrid({
  date,
  gridStartMin,
  gridEndMin,
  blockedAllDay,
  blockedRanges,
  appointments,
  prevHref,
  nextHref,
}: {
  date: string
  gridStartMin: number
  gridEndMin:   number
  blockedAllDay: boolean
  blockedRanges: BlockedRange[]
  appointments: GridAppointment[]
  prevHref: string
  nextHref: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<GridAppointment | null>(null)
  const [, startTransition] = useTransition()
  const touchStartX = useRef<number | null>(null)

  const isToday = date === format(new Date(), 'yyyy-MM-dd')
  const nowMin = useNowMinutes(isToday)

  const handleUnblock = (range: BlockedRange) => {
    const ok = window.confirm(`Desbloquear o horário de ${minutesToHHMM(range.startMin)} a ${minutesToHHMM(range.endMin)}?`)
    if (!ok) return
    startTransition(async () => {
      await unblockTimeRange(date, minutesToHHMM(range.startMin), minutesToHHMM(range.endMin))
      router.refresh()
    })
  }

  const layout = useMemo(
    () => layoutColumns(appointments.map(a => ({ id: a.id, startMin: a.startMin, endMin: a.endMin }))),
    [appointments],
  )

  const totalHeight = minutesToPx(gridEndMin - gridStartMin)
  const marks = useHalfHourMarks(gridStartMin, gridEndMin)

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
    router.push(delta > 0 ? prevHref : nextHref)
  }

  return (
    <div
      className="relative border border-offwhite/10 overflow-x-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex min-w-[320px]" style={{ height: totalHeight }}>
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

        {/* Content area */}
        <div className="relative flex-1">
          {marks.map(({ min, isHour }) => (
            <div
              key={min}
              className={cn('absolute inset-x-0', isHour ? 'border-t border-offwhite/8' : 'border-t border-dotted border-offwhite/6')}
              style={{ top: minutesToPx(min - gridStartMin) }}
            />
          ))}

          {nowMin !== null && nowMin >= gridStartMin && nowMin <= gridEndMin && (
            <div
              className="absolute inset-x-0 z-10 flex items-center pointer-events-none"
              style={{ top: minutesToPx(nowMin - gridStartMin) }}
            >
              <span className="w-[7px] h-[7px] rounded-full bg-gold -ml-[3.5px] shrink-0" />
              <span className="flex-1 h-px bg-gold/70" />
            </div>
          )}

          {blockedAllDay ? (
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(241,241,241,0.03),rgba(241,241,241,0.03)_8px,transparent_8px,transparent_16px)] flex items-center justify-center">
              <p className="font-display font-light text-[16px] text-offwhite/25 italic">Folga / fechado</p>
            </div>
          ) : (
            <>
              {blockedRanges.map((r, i) => {
                const top = minutesToPx(r.startMin - gridStartMin)
                const height = minutesToPx(r.endMin - r.startMin)
                return (
                  <button
                    key={i}
                    onClick={() => handleUnblock(r)}
                    title="Clique para desbloquear"
                    className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,rgba(241,241,241,0.04),rgba(241,241,241,0.04)_8px,transparent_8px,transparent_16px)] border-y border-offwhite/10 flex items-center justify-center hover:bg-[repeating-linear-gradient(135deg,rgba(241,241,241,0.07),rgba(241,241,241,0.07)_8px,transparent_8px,transparent_16px)] transition-all duration-150"
                    style={{ top, height }}
                  >
                    <p className="font-body font-light text-[9px] text-offwhite/30 uppercase tracking-[0.15em]">Bloqueado</p>
                  </button>
                )
              })}
              {appointments.map(a => {
                const pos = layout.get(a.id) ?? { col: 0, cols: 1 }
                const top = minutesToPx(a.startMin - gridStartMin)
                const height = Math.max(minutesToPx(a.endMin - a.startMin), 22)
                const widthPct = 100 / pos.cols
                const showDetails = height >= 40
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={cn(
                      'absolute px-2 py-[3px] border-l-[3px] border-y border-r text-left overflow-hidden transition-all duration-150',
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
                    <p className="font-data text-[10px] leading-tight truncate">{a.timeLabel}</p>
                    <p className="font-body font-light text-[10px] leading-tight truncate">{a.clientName}</p>
                    {showDetails && (
                      <p className="font-body font-light text-[8.5px] leading-tight truncate opacity-70">{a.serviceName}</p>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {selected && (
        <AppointmentDetailSheet appt={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
