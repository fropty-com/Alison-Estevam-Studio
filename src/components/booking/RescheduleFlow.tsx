'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { format, parseISO, addMonths, subMonths, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { buildIcsDataUrl } from '@/lib/calendar/ics'

interface SlotData { id: string; startTime: string; available: boolean }
interface AvailMap  { [date: string]: { available: boolean; slots: SlotData[] } }

const MONTH_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const WEEK_PT  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export function RescheduleFlow({ code, currentDate, serviceName = 'Agendamento', duration = 60 }: { code: string; currentDate: string; serviceName?: string; duration?: number }) {
  const today      = new Date()
  const [viewing,  setViewing]  = useState(() => startOfMonth(today))
  const [avail,    setAvail]    = useState<AvailMap>({})
  const [loading,  setLoading]  = useState(false)
  const [selDate,  setSelDate]  = useState<string | null>(null)
  const [selSlot,  setSelSlot]  = useState<SlotData | null>(null)
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

  const daysInMonth = getDaysInMonth(viewing)
  const firstDay    = getDay(viewing) // 0=Sun

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
      <div className="bg-offwhite/3 border border-offwhite/7 p-8 text-center">
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

  const slots = selDate ? (avail[selDate]?.slots ?? []).filter(s => s.available) : []

  return (
    <div className="space-y-6">
      <p className="font-body font-light text-[12px] text-offwhite/40 leading-relaxed">
        Selecione um novo dia e horário. Seu agendamento anterior ({currentDate}) será liberado.
      </p>

      {/* Month nav */}
      <div className="bg-offwhite/3 border border-offwhite/7">
        <div className="flex items-center justify-between px-5 py-4 border-b border-offwhite/6">
          <button
            onClick={() => changeMonth(-1)}
            disabled={viewing <= startOfMonth(today)}
            className="font-body font-light text-[10px] text-offwhite/30 hover:text-offwhite/65 disabled:opacity-20 transition-colors px-1"
          >
            ‹
          </button>
          <span className="font-body font-light text-[9px] tracking-[0.3em] uppercase text-offwhite/50">
            {MONTH_PT[viewing.getMonth()]} {viewing.getFullYear()}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="font-body font-light text-[10px] text-offwhite/30 hover:text-offwhite/65 transition-colors px-1"
          >
            ›
          </button>
        </div>

        <div className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEK_PT.map(d => (
              <div key={d} className="text-center font-body font-light text-[7.5px] tracking-[0.22em] uppercase text-offwhite/38 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day       = i + 1
              const dateStr   = `${format(viewing, 'yyyy-MM')}-${String(day).padStart(2, '0')}`
              const isPast    = parseISO(dateStr) < today
              const info      = avail[dateStr]
              const isAvail   = !isPast && info?.available
              const isSel     = selDate === dateStr

              return (
                <button
                  key={day}
                  disabled={!isAvail || loading}
                  onClick={() => { setSelDate(dateStr); setSelSlot(null) }}
                  className={cn(
                    'aspect-square flex items-center justify-center',
                    'font-body font-light text-[11px] transition-all duration-150',
                    isSel
                      ? 'bg-sage/25 text-sage-light border border-sage/40'
                      : isAvail
                        ? 'text-offwhite/75 hover:bg-sage/12 border border-transparent hover:border-sage/25 hover:text-sage-light'
                        : 'text-offwhite/25 cursor-not-allowed'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Slots */}
      {selDate && (
        <div>
          <p className="font-body font-light text-[8px] tracking-[0.35em] uppercase text-offwhite/28 mb-3">
            Horários disponíveis — {format(parseISO(selDate), "d 'de' MMMM", { locale: ptBR })}
          </p>
          {slots.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/25 italic">Nenhum horário disponível.</p>
          ) : (
            <div className="flex flex-wrap gap-[6px]">
              {slots.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelSlot(s)}
                  className={cn(
                    'px-4 py-[9px] font-data text-[13px] border transition-all duration-150',
                    selSlot?.id === s.id
                      ? 'bg-sage/20 border-sage/45 text-sage-light'
                      : 'bg-offwhite/3 border-offwhite/10 text-offwhite/60 hover:border-offwhite/25 hover:text-offwhite/85'
                  )}
                >
                  {s.startTime.substring(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>
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
              'w-full py-[13px] font-body font-light text-[9px] tracking-[0.35em] uppercase',
              'bg-sage/15 border border-sage/30 text-sage-light',
              'hover:bg-sage/25 hover:border-sage/50',
              'transition-all duration-200 disabled:opacity-40'
            )}
          >
            {pending ? 'Reagendando…' : `Confirmar — ${selSlot.startTime.substring(0, 5).replace(':', 'h')}`}
          </button>
        </div>
      )}
    </div>
  )
}
