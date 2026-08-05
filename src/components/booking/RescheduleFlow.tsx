'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { format, parseISO, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { buildIcsDataUrl } from '@/lib/calendar/ics'
import { MiniCalendar, SlotGrid, type CalendarSlot, type AvailabilityMap } from '@/components/booking/MiniCalendar'
import { Button } from '@/components/ui/Button'
import { ResultCard } from '@/components/booking/BookingChrome'

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
      <ResultCard title="Agendamento reagendado.">
        <p className="font-body font-light text-[11px] text-offwhite/55 tracking-[0.12em] capitalize mb-1">{dateLabel}</p>
        <p className="font-data text-[22px] text-offwhite/55">{done.startTime.replace(':', 'h')}</p>
        <a
          href={buildIcsDataUrl({
            title:           serviceName,
            date:            done.date,
            startTime:       done.startTime,
            durationMinutes: duration,
          })}
          download="agendamento-alison-estevam.ics"
          className="inline-block mt-4 font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/55 hover:text-offwhite/65 transition-colors underline underline-offset-4 decoration-offwhite/15"
        >
          Adicionar ao calendário
        </a>
        <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.15em] mt-4">
          Confirme pelo WhatsApp se necessário.
        </p>
      </ResultCard>
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
        <SlotGrid date={selDate} slots={slots} selected={selSlot} onSelect={setSelSlot} />
      )}

      {/* Confirm */}
      {selSlot && (
        <div className="space-y-3">
          {error && (
            <p role="alert" className="font-body font-light text-[9px] tracking-[0.15em] text-error/70">{error}</p>
          )}
          <Button onClick={handleConfirm} loading={pending} loadingText="Reagendando" size="lg" className="w-full">
            {`Confirmar — ${selSlot.startTime.substring(0, 5).replace(':', 'h')}`}
          </Button>
        </div>
      )}
    </div>
  )
}
