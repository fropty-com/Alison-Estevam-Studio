'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { format, parseISO, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { buildIcsDataUrl } from '@/lib/calendar/ics'
import { MiniCalendar, SlotGrid, type CalendarSlot, type AvailabilityMap } from '@/components/booking/MiniCalendar'

export function RescheduleFlow({ code, serviceName = 'Agendamento', duration = 60 }: { code: string; serviceName?: string; duration?: number }) {
  const today      = new Date()
  const [viewing,  setViewing]  = useState(() => startOfMonth(today))
  const [avail,    setAvail]    = useState<AvailabilityMap>({})
  const [loading,  setLoading]  = useState(false)
  const [selDate,  setSelDate]  = useState<Date | null>(null)
  const [selSlot,  setSelSlot]  = useState<CalendarSlot | null>(null)
  const [pending,  startTransition] = useTransition()
  const [done,     setDone]     = useState<{ date: string; startTime: string } | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const fetchAvail = useCallback(async (month: Date) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/availability?year=${month.getFullYear()}&month=${month.getMonth() + 1}&duration=${duration}`)
      const data = await res.json()
      setAvail(prev => ({ ...prev, ...(data.availability ?? {}) }))
    } finally {
      setLoading(false)
    }
  }, [duration])

  const changeMonth = (dir: 1 | -1) => {
    const next = dir === 1 ? addMonths(viewing, 1) : subMonths(viewing, 1)
    if (next < startOfMonth(today)) return
    setViewing(next)
    setSelDate(null)
    setSelSlot(null)
    fetchAvail(next)
  }

  // Load current month on first render
  useEffect(() => { fetchAvail(viewing) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    if (!selSlot) return
    setError(null)
    startTransition(async () => {
      const res  = await fetch(`/api/appointments/${code}/reschedule`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ newSlotId: selSlot.id }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Erro ao reagendar.')
      else setDone({ date: data.date, startTime: data.startTime })
    })
  }

  if (done) {
    const dateLabel = format(parseISO(done.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    return (
      <div className="bg-offwhite/5 border border-offwhite/10 p-8 text-center">
        <p className="font-display font-light text-[22px] text-offwhite/60 italic mb-3">
          Agendamento reagendado.
        </p>
        <p className="font-body font-light text-[11px] text-offwhite/40 tracking-[0.12em] capitalize mb-1">{dateLabel}</p>
        <p className="font-data text-[22px] text-offwhite/55">{done.startTime.replace(':', 'h')}</p>
        <a
          href={buildIcsDataUrl({
            title:           serviceName,
            date:            done.date,
            startTime:       done.startTime,
            durationMinutes: duration,
          })}
          download="agendamento-alison-estevam.ics"
          className="inline-block mt-4 font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/35 hover:text-offwhite/65 transition-colors underline underline-offset-4 decoration-offwhite/15"
        >
          Adicionar ao calendário
        </a>
        <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.15em] mt-4">
          Confirme pelo WhatsApp se necessário.
        </p>
      </div>
    )
  }

  const dateStr = selDate ? format(selDate, 'yyyy-MM-dd') : null
  const slots   = dateStr ? (avail[dateStr]?.slots ?? []) : []

  return (
    <div className="space-y-6">
      <MiniCalendar
        current={viewing}
        selected={selDate}
        availability={avail}
        loading={loading}
        onSelectDay={date => { setSelDate(date); setSelSlot(null) }}
        onChangeMonth={changeMonth}
      />

      {selDate && (
        slots.some(s => s.available) ? (
          <SlotGrid date={selDate} slots={slots} selected={selSlot} onSelect={setSelSlot} />
        ) : (
          <div className="mt-[18px]">
            <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/22 mb-[10px]">
              {format(selDate, "d 'de' MMMM", { locale: ptBR })} — sem horários
            </p>
            <p className="font-body font-light text-[11px] text-offwhite/30 italic">
              Nenhum horário disponível para esta data.
            </p>
          </div>
        )
      )}

      {/* Confirm */}
      {selSlot && (
        <div className="space-y-3">
          {error && (
            <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70">{error}</p>
          )}
          <button
            onClick={handleConfirm}
            disabled={pending}
            className={cn(
              'w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
              'bg-gold text-charcoal-deep transition-all duration-300',
              'hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {pending ? 'Reagendando…' : `Confirmar — ${selSlot.startTime.substring(0, 5).replace(':', 'h')}`}
          </button>
        </div>
      )}
    </div>
  )
}
