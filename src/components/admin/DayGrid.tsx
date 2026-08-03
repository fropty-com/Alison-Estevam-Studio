'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { minutesToPx, HOUR_HEIGHT, layoutColumns } from '@/lib/schedule/dayGridLayout'
import { AppointmentDetailSheet, type DetailAppointment } from './AppointmentDetailSheet'
import { unblockTimeRange, rescheduleAppointmentAdmin } from '@/app/admin/actions'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

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

// Solid fills, matching Outlook's actual event blocks (solid color + colored
// left border) rather than the diagonal hatching used before. Kept for the
// compact month-view chips, which have no room/data for the richer,
// service-colored treatment below.
export const STATUS_BLOCK: Record<string, string> = {
  pending:     'border-gold/60 text-gold-light bg-gold/15',
  confirmed:   'border-sage/60 text-sage-light bg-sage/20',
  checked_in:  'border-gold text-gold bg-gold/30',
  in_progress: 'border-gold text-gold bg-gold/30',
  completed:   'border-offwhite/30 text-offwhite/50 bg-offwhite/5',
  cancelled:   'border-error/50 text-error/70 bg-error/15',
  no_show:     'border-error/40 text-error/55 bg-error/10',
}

// Muted, on-brand hues used to color-code the day/week grid blocks by
// service. Kept out of Tailwind's class system (inline rgba() instead) since
// arbitrary opacity combinations don't reliably compile in this project.
const SERVICE_PALETTE: [number, number, number][] = [
  [203, 163, 57],   // gold
  [150, 156, 115],  // sage
  [176, 108, 74],   // terracotta
  [98, 130, 156],   // steel blue
  [140, 104, 140],  // plum
  [92, 140, 130],   // teal
]
const OFFWHITE_RGB: [number, number, number] = [241, 241, 241]
const ERROR_RGB:    [number, number, number] = [139, 58, 58]
const GOLD_RGB:     [number, number, number] = [203, 163, 57]

function serviceColor(serviceName: string): [number, number, number] {
  let hash = 0
  for (let i = 0; i < serviceName.length; i++) hash = (hash * 31 + serviceName.charCodeAt(i)) >>> 0
  return SERVICE_PALETTE[hash % SERVICE_PALETTE.length]
}

/**
 * Block appearance for the day/week grid: color-coded by service, with the
 * border going from dashed+faint (pending, no client confirmation yet) to
 * solid+bolder (confirmed) — so confirmation state reads at a glance without
 * losing which service it is. Checked-in/in-progress get a dedicated gold
 * highlight (more urgent than the service itself: someone is in the chair
 * right now); completed/cancelled/no-show keep their own neutral/error tone
 * since those statuses matter more than the service at that point.
 */
export function appointmentBlockStyle(status: string, serviceName: string): { style: React.CSSProperties; textClass: string } {
  if (status === 'checked_in' || status === 'in_progress') {
    const [r, g, b] = GOLD_RGB
    return {
      style: { backgroundColor: `rgba(${r},${g},${b},0.3)`, borderColor: `rgba(${r},${g},${b},0.9)`, borderStyle: 'solid' },
      textClass: 'text-gold',
    }
  }
  if (status === 'completed') {
    const [r, g, b] = OFFWHITE_RGB
    return {
      style: { backgroundColor: `rgba(${r},${g},${b},0.05)`, borderColor: `rgba(${r},${g},${b},0.3)`, borderStyle: 'solid' },
      textClass: 'text-offwhite/50',
    }
  }
  if (status === 'cancelled' || status === 'no_show') {
    const [r, g, b] = ERROR_RGB
    return {
      style: { backgroundColor: `rgba(${r},${g},${b},0.15)`, borderColor: `rgba(${r},${g},${b},${status === 'cancelled' ? 0.5 : 0.4})`, borderStyle: 'solid' },
      textClass: status === 'cancelled' ? 'text-error/70' : 'text-error/55',
    }
  }

  // pending / confirmed — service-colored, solidity signals confirmation
  const [r, g, b] = serviceColor(serviceName)
  const confirmed = status === 'confirmed'
  return {
    style: {
      backgroundColor: `rgba(${r},${g},${b},${confirmed ? 0.3 : 0.13})`,
      borderColor: `rgba(${r},${g},${b},${confirmed ? 0.85 : 0.55})`,
      borderStyle: confirmed ? 'solid' : 'dashed',
    },
    textClass: confirmed ? 'text-offwhite/90' : 'text-offwhite/75',
  }
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
  const { t } = useTranslation()
  const router = useRouter()
  const [selected, setSelected] = useState<GridAppointment | null>(null)
  const [, startTransition] = useTransition()
  const touchStartX = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const isToday = date === format(new Date(), 'yyyy-MM-dd')
  const nowMin = useNowMinutes(isToday)

  const handleUnblock = (range: BlockedRange) => {
    const ok = window.confirm(t.agenda.unblockConfirm(minutesToHHMM(range.startMin), minutesToHHMM(range.endMin)))
    if (!ok) return
    startTransition(async () => {
      await unblockTimeRange(date, minutesToHHMM(range.startMin), minutesToHHMM(range.endMin))
      router.refresh()
    })
  }

  const canDrag = (status: string) => status === 'pending' || status === 'confirmed'

  const handleDragStart = (e: React.DragEvent, a: GridAppointment) => {
    if (!canDrag(a.status)) { e.preventDefault(); return }
    e.dataTransfer.setData('text/plain', a.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('text/plain')
    if (!id || !contentRef.current) return

    const rect = contentRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutesFromTop = (y / HOUR_HEIGHT) * 60
    const rawMin = gridStartMin + minutesFromTop
    const snappedMin = Math.min(gridEndMin, Math.max(gridStartMin, Math.round(rawMin / 60) * 60))
    const newStartTime = minutesToHHMM(snappedMin)

    startTransition(async () => {
      const res = await rescheduleAppointmentAdmin(id, date, newStartTime)
      if (res?.error) window.alert(res.error)
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
        <div className="relative w-[52px] shrink-0 border-r border-offwhite/[0.08]">
          {marks.map(({ min, isHour }) => (
            <span
              key={min}
              className={cn(
                'absolute right-2 -translate-y-1/2 font-body font-light tracking-[0.05em]',
                isHour ? 'text-[8px] text-offwhite/[0.32]' : 'text-[7px] text-offwhite/[0.16]'
              )}
              style={{ top: minutesToPx(min - gridStartMin) }}
            >
              {String(Math.floor(min / 60)).padStart(2, '0')}:{min % 60 === 0 ? '00' : '30'}
            </span>
          ))}
        </div>

        {/* Content area */}
        <div
          ref={contentRef}
          className={cn('relative flex-1', dragOver && 'bg-gold/[0.04]')}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {marks.map(({ min, isHour }) => (
            <div
              key={min}
              className={cn('absolute inset-x-0', isHour ? 'border-t border-offwhite/[0.08]' : 'border-t border-dotted border-offwhite/[0.06]')}
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
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(var(--c-offwhite)/0.03),rgb(var(--c-offwhite)/0.03)_8px,transparent_8px,transparent_16px)] flex items-center justify-center">
              <p className="font-display font-light text-[16px] text-offwhite/25 italic">{t.agenda.dayOffClosed}</p>
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
                    title={t.agenda.unblockTitle}
                    className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,rgb(var(--c-offwhite)/0.04),rgb(var(--c-offwhite)/0.04)_8px,transparent_8px,transparent_16px)] border-y border-offwhite/10 flex items-center justify-center hover:bg-[repeating-linear-gradient(135deg,rgb(var(--c-offwhite)/0.07),rgb(var(--c-offwhite)/0.07)_8px,transparent_8px,transparent_16px)] transition-all duration-150"
                    style={{ top, height }}
                  >
                    <p className="font-body font-light text-[9px] text-offwhite/30 uppercase tracking-[0.15em]">{t.agenda.blockedLabel}</p>
                  </button>
                )
              })}
              {appointments.map(a => {
                const pos = layout.get(a.id) ?? { col: 0, cols: 1 }
                const top = minutesToPx(a.startMin - gridStartMin)
                const height = Math.max(minutesToPx(a.endMin - a.startMin), 22)
                const widthPct = 100 / pos.cols
                const showDetails = height >= 40
                const { style: blockStyle, textClass } = appointmentBlockStyle(a.status, a.serviceName)
                return (
                  <button
                    key={a.id}
                    draggable={canDrag(a.status)}
                    onDragStart={e => handleDragStart(e, a)}
                    onClick={() => setSelected(a)}
                    title={canDrag(a.status) ? t.agenda.dragToReschedule : undefined}
                    className={cn(
                      'absolute px-2 py-[3px] border-l-[3px] border-y border-r text-left overflow-hidden transition-all duration-150',
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
