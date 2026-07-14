'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { HOUR_HEIGHT, minutesToPx, layoutColumns } from '@/lib/schedule/dayGridLayout'
import { AppointmentDetailSheet, type DetailAppointment } from './AppointmentDetailSheet'

export interface GridAppointment extends DetailAppointment {
  startMin: number
  endMin: number
}

const STATUS_BLOCK: Record<string, string> = {
  pending:     'bg-gold/15 border-gold/45 text-gold-light',
  confirmed:   'bg-sage/15 border-sage/45 text-sage-light',
  checked_in:  'bg-gold/28 border-gold/60 text-gold',
  in_progress: 'bg-gold/28 border-gold/60 text-gold',
  completed:   'bg-offwhite/8 border-offwhite/22 text-offwhite/50',
  cancelled:   'bg-error/10 border-error/30 text-error/55',
  no_show:     'bg-error/8 border-error/25 text-error/45',
}

const SWIPE_THRESHOLD_PX = 60

export function DayGrid({
  gridStartMin,
  gridEndMin,
  blockedAllDay,
  appointments,
  prevHref,
  nextHref,
}: {
  gridStartMin: number
  gridEndMin:   number
  blockedAllDay: boolean
  appointments: GridAppointment[]
  prevHref: string
  nextHref: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<GridAppointment | null>(null)
  const touchStartX = useRef<number | null>(null)

  const layout = useMemo(
    () => layoutColumns(appointments.map(a => ({ id: a.id, startMin: a.startMin, endMin: a.endMin }))),
    [appointments],
  )

  const totalHeight = minutesToPx(gridEndMin - gridStartMin)
  const hours = useMemo(() => {
    const list: number[] = []
    for (let m = Math.ceil(gridStartMin / 60) * 60; m <= gridEndMin; m += 60) list.push(m)
    return list
  }, [gridStartMin, gridEndMin])

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
          {hours.map(m => (
            <span
              key={m}
              className="absolute right-2 -translate-y-1/2 font-body font-light text-[8px] text-offwhite/30 tracking-[0.05em]"
              style={{ top: minutesToPx(m - gridStartMin) }}
            >
              {String(Math.floor(m / 60)).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* Content area */}
        <div className="relative flex-1">
          {hours.map(m => (
            <div
              key={m}
              className="absolute inset-x-0 border-t border-offwhite/6"
              style={{ top: minutesToPx(m - gridStartMin) }}
            />
          ))}

          {blockedAllDay ? (
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(241,241,241,0.03),rgba(241,241,241,0.03)_8px,transparent_8px,transparent_16px)] flex items-center justify-center">
              <p className="font-display font-light text-[16px] text-offwhite/25 italic">Folga / fechado</p>
            </div>
          ) : (
            appointments.map(a => {
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
                    'absolute px-2 py-[3px] border text-left overflow-hidden transition-all duration-150',
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
            })
          )}
        </div>
      </div>

      {selected && (
        <AppointmentDetailSheet appt={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
