'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { buildBookingConfirmationUrl, buildExclusiveRequestUrl } from '@/lib/whatsapp/messages'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, parseISO, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BOOKING } from '@/config/booking'

/* ── Types ─────────────────────────────────────── */
interface Service {
  id: string
  slug: string
  name: string
  price: number
  duration: number
  is_whatsapp_only: boolean
}

interface Complement {
  id: string
  name: string
  description: string
  price: number
}

interface Slot {
  id: string
  startTime: string
  available: boolean
}

interface DayAvailability {
  available: boolean
  slots: Slot[]
}

type AvailabilityMap = Record<string, DayAvailability>

type Step = 'service' | 'complements' | 'schedule' | 'details' | 'success'

interface BookingState {
  step: Step
  selectedService: Service | null
  selectedComplementIds: string[]
  selectedDate: Date | null
  selectedSlot: Slot | null
  result: {
    clientName:      string
    serviceName:     string
    complementNames: string[]
    servicePrice:    number
    complementsPrice: number
    totalPrice:      number
    date:            string
    startTime:       string
    wppUrl:          string
  } | null
}

const STEP_ORDER: Step[] = ['service', 'schedule', 'details', 'success']
const STEP_LABEL: Record<Step, string> = {
  service:     'Serviço',
  complements: 'Serviço',
  schedule:    'Data & Horário',
  details:     'Seus Dados',
  success:     'Confirmação',
}

/* ── Step indicator ────────────────────────────── */
function StepDots({ current }: { current: Step }) {
  const displayStep = current === 'complements' ? 'service' : current
  const idx = STEP_ORDER.indexOf(displayStep)
  return (
    <div className="flex items-center gap-2" aria-label="Etapas do agendamento">
      {STEP_ORDER.map((s, i) => {
        const status = i < idx ? 'done' : i === idx ? 'active' : 'idle'
        return (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-[18px] h-px bg-offwhite/15 shrink-0" aria-hidden="true" />}
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0',
                'font-body font-light text-[9px] transition-all duration-300',
                status === 'active' && 'border-gold text-gold bg-gold/8',
                status === 'done'   && 'border-sage bg-sage text-offwhite',
                status === 'idle'   && 'border-offwhite/14 text-offwhite/22',
              )}>
                {status === 'done' ? '✓' : i + 1}
              </div>
              <span className={cn(
                'font-body font-light text-[8px] tracking-[0.24em] uppercase transition-colors duration-300',
                status === 'active' && 'text-offwhite/55',
                status === 'done'   && 'text-sage-light',
                status === 'idle'   && 'text-offwhite/22',
              )}>
                {STEP_LABEL[s]}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Service picker ────────────────────────────── */
function ServicePicker({
  services,
  onSelect,
  onExclusive,
}: {
  services: Service[]
  onSelect: (service: Service) => void
  onExclusive: () => void
}) {
  if (services.length === 0) {
    return (
      <p className="font-body font-light text-[11px] text-offwhite/30 italic">
        Carregando serviços…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-[10px]">
      {services.map(s => (
        <div
          key={s.id}
          role="button"
          tabIndex={0}
          onClick={() => s.is_whatsapp_only ? onExclusive() : onSelect(s)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.is_whatsapp_only ? onExclusive() : onSelect(s) } }}
          className={cn(
            'border border-offwhite/14 px-[18px] py-[16px] cursor-pointer',
            'flex items-center justify-between gap-4',
            'transition-all duration-200 hover:border-gold hover:bg-gold/6',
          )}
        >
          <div>
            <p className="font-display font-light text-lg text-offwhite tracking-[0.03em]">
              {s.name}
            </p>
            <p className="font-body font-light text-2xs tracking-[0.18em] uppercase text-offwhite/35 mt-1">
              {s.is_whatsapp_only ? 'Combinado via WhatsApp' : `${s.duration >= 60 ? `${Math.floor(s.duration / 60)}h${s.duration % 60 ? s.duration % 60 : ''}` : `${s.duration} min`}`}
            </p>
          </div>
          <span className="font-data text-lg text-gold shrink-0">{formatCurrency(s.price)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Complements picker ────────────────────────── */
function ComplementsPicker({
  complements,
  selected,
  onToggle,
  onContinue,
}: {
  complements: Complement[]
  selected: string[]
  onToggle: (id: string) => void
  onContinue: () => void
}) {
  return (
    <div>
      <span className="inline-block font-body font-light text-2xs tracking-[0.2em] uppercase text-offwhite/40 border border-offwhite/20 px-[10px] py-[3px] mb-[14px]">
        Opcional
      </span>
      <p className="font-body font-light text-[12px] text-offwhite/45 mb-[18px] leading-[1.7]">
        Adicione um cuidado extra ao seu horário, se quiser — não é obrigatório.
      </p>
      <div className="flex flex-col gap-[10px] mb-[22px]">
        {complements.map(c => {
          const isSel = selected.includes(c.id)
          return (
            <div
              key={c.id}
              role="checkbox"
              aria-checked={isSel}
              tabIndex={0}
              onClick={() => onToggle(c.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(c.id) } }}
              className={cn(
                'border px-[16px] py-[14px] cursor-pointer',
                'flex items-center justify-between gap-4 transition-all duration-200',
                isSel ? 'border-gold bg-gold/8' : 'border-offwhite/14 hover:border-offwhite/30',
              )}
            >
              <div>
                <p className="font-body font-normal text-sm text-offwhite">{c.name}</p>
                <p className="font-body font-light text-2xs text-offwhite/35 mt-[2px]">{c.description}</p>
              </div>
              <span className="font-data text-sm text-gold shrink-0">{formatCurrency(c.price)}</span>
            </div>
          )
        })}
      </div>
      <button
        onClick={onContinue}
        className="w-full py-[16px] font-body font-light text-[9.5px] tracking-[0.38em] uppercase bg-sage text-offwhite transition-all duration-300 hover:bg-sage-light"
      >
        {selected.length > 0 ? 'Continuar' : 'Continuar sem complementos'}
      </button>
    </div>
  )
}

/* ── Calendar ──────────────────────────────────── */
function MiniCalendar({
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
    return { day: i + 1, date: d, dateStr, past, unavailable, disabled, hasSlots: info?.available ?? false }
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
              'hover:border-sage hover:text-sage-light hover:bg-sage/7',
              'disabled:opacity-20 disabled:pointer-events-none'
            )}
          >‹</button>
          <button
            onClick={() => onChangeMonth(1)}
            aria-label="Próximo mês"
            className={cn(
              'w-7 h-7 border border-offwhite/10 text-offwhite/32 text-[13px]',
              'flex items-center justify-center transition-all duration-200',
              'hover:border-sage hover:text-sage-light hover:bg-sage/7'
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
                'aspect-square flex items-center justify-center relative',
                'font-body font-light text-[11.5px] rounded-none',
                'border border-transparent transition-all duration-200',
                past        && 'opacity-[0.18] pointer-events-none select-none',
                unavailable && 'opacity-[0.28] cursor-default select-none',
                !disabled   && 'text-offwhite/75 cursor-pointer hover:bg-gold/12 hover:text-gold hover:border-gold/30 hover:scale-110',
                todayDay    && !disabled && !isSelected && 'text-offwhite border-offwhite/30 font-normal',
                isSelected  && 'bg-gold/90 text-charcoal-deep border-gold font-normal scale-105',
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

/* ── Slot picker ───────────────────────────────── */
function SlotPicker({
  date,
  slots,
  selected,
  onSelect,
}: {
  date:     Date
  slots:    Slot[]
  selected: Slot | null
  onSelect: (slot: Slot) => void
}) {
  const available = slots.filter(s => s.available)

  if (available.length === 0) {
    return (
      <div className="mt-[18px]">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/22 mb-[10px]">
          {format(date, "d 'de' MMMM", { locale: ptBR })} — sem horários
        </p>
        <p className="font-body font-light text-[11px] text-offwhite/30 italic">
          Nenhum horário disponível para esta data com este serviço.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-[18px]">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-sage-light/55 mb-[10px]">
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
                !isSel && 'text-offwhite/65 border-offwhite/14 hover:border-sage hover:text-sage-light hover:bg-sage/8',
                isSel && 'bg-sage border-sage text-offwhite',
              )}
            >
              {slot.startTime.replace(':', 'h')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Booking form ──────────────────────────────── */
function BookingForm({
  selectedDate,
  selectedSlot,
  service,
  complementIds,
  onConfirm,
}: {
  selectedDate:  Date
  selectedSlot:  Slot
  service:       Service
  complementIds: string[]
  onConfirm: (data: {
    name: string; whatsapp: string; email: string
    complementNames: string[]; servicePrice: number; complementsPrice: number; totalPrice: number
    date: string; startTime: string
  }) => void
}) {
  const [name,      setName]      = useState('')
  const [whatsapp,  setWhatsapp]  = useState('')
  const [email,     setEmail]     = useState('')
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [loading,   setLoading]   = useState(false)
  const [apiError,  setApiError]  = useState<string | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (name.trim().length < 2)          e.name     = 'Por favor, informe seu nome.'
    if (whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Por favor, informe seu WhatsApp.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError(null)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:      name.trim(),
          whatsapp:  whatsapp.trim(),
          email:     email.trim() || undefined,
          serviceId: service.id,
          slotId:    selectedSlot.id,
          complementIds,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? 'Erro ao confirmar agendamento. Tente novamente.')
        return
      }

      onConfirm({
        name:             name.trim(),
        whatsapp:         whatsapp.trim(),
        email:            email.trim(),
        complementNames:  data.complementNames ?? [],
        servicePrice:     data.servicePrice,
        complementsPrice: data.complementsPrice,
        totalPrice:       data.totalPrice,
        date:             data.date,
        startTime:        data.startTime,
      })
    } catch {
      setApiError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const dateLabel = format(selectedDate, "d 'de' MMMM", { locale: ptBR })
  const slotLabel = `${service.name} · ${dateLabel} às ${selectedSlot.startTime.replace(':', 'h')}`

  return (
    <div>
      <div className="flex items-center gap-[11px] px-[15px] py-[13px] bg-sage/7 border border-sage/16 mb-[22px]">
        <span className="w-[5px] h-[5px] rounded-full bg-sage shrink-0 animate-pulse-dot" aria-hidden="true" />
        <span className="font-body font-light text-2xs tracking-[0.2em] uppercase text-sage-light">
          {slotLabel}
        </span>
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]" htmlFor="f-nome">
          Seu nome
        </label>
        <input
          id="f-nome"
          type="text"
          autoComplete="given-name"
          autoCapitalize="words"
          placeholder="Como você se chama?"
          value={name}
          onChange={e => setName(e.target.value)}
          className={cn(
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-sm px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/35 placeholder:font-body placeholder:font-light',
            errors.name ? 'border-error/55' : 'border-offwhite/20 focus:border-sage focus:bg-sage/5'
          )}
        />
        {errors.name && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.name}</p>}
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]" htmlFor="f-tel">
          WhatsApp
        </label>
        <input
          id="f-tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
          className={cn(
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-sm px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/35 placeholder:font-body placeholder:font-light',
            errors.whatsapp ? 'border-error/55' : 'border-offwhite/20 focus:border-sage focus:bg-sage/5'
          )}
        />
        {errors.whatsapp && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.whatsapp}</p>}
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]" htmlFor="f-email">
          E-mail <span className="text-offwhite/20">(opcional)</span>
        </label>
        <input
          id="f-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Para receber confirmação por e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={cn(
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-sm px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/35 placeholder:font-body placeholder:font-light',
            errors.email ? 'border-error/55' : 'border-offwhite/20 focus:border-sage focus:bg-sage/5'
          )}
        />
        {errors.email && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.email}</p>}
      </div>

      {apiError && (
        <div className="mb-[13px] px-[15px] py-[12px] border border-error/30 bg-error/5">
          <p className="font-body font-light text-[10px] tracking-[0.18em] text-error/80">{apiError}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={cn(
          'w-full mt-[10px] py-[17px]',
          'font-body font-light text-[9.5px] tracking-[0.38em] uppercase',
          'bg-sage text-offwhite',
          'transition-all duration-300',
          'hover:bg-sage-light hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(122,145,130,0.30)]',
          'active:translate-y-0',
          'disabled:opacity-45 disabled:cursor-not-allowed',
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-[10px]">
            <span className="flex gap-1">
              {[0, 200, 400].map(d => (
                <span key={d} className="w-1 h-1 rounded-full bg-current animate-dot-loading" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
            <span>Confirmando</span>
          </span>
        ) : 'Confirmar Agendamento'}
      </button>
    </div>
  )
}

/* ── Confirmation ──────────────────────────────── */
function Confirmation({
  result,
  onRestart,
}: {
  result:    NonNullable<BookingState['result']>
  onRestart: () => void
}) {
  const dateFormatted = format(parseISO(result.date), "d 'de' MMMM", { locale: ptBR })

  return (
    <div className="animate-fade-up">
      <div className="w-[42px] h-[42px] rounded-full border border-sage/30 flex items-center justify-center text-sage text-[17px] mb-[18px]">
        ✓
      </div>
      <p className="font-display font-light text-3xl text-offwhite leading-[1.2] mb-[7px]">
        Perfeito, {result.clientName}. Até lá!
      </p>
      <p className="font-body font-light text-2xs tracking-[0.24em] text-offwhite/32 mb-[5px] leading-[1.9]">
        {result.serviceName}<br />
        {dateFormatted} · {result.startTime.replace(':', 'h')}
      </p>

      <div className="border border-offwhite/10 mt-[18px] mb-[22px]">
        <div className="flex justify-between px-[15px] py-[10px] border-b border-offwhite/8">
          <span className="font-body font-light text-2xs text-offwhite/45">Serviço</span>
          <span className="font-body font-light text-2xs text-offwhite">{formatCurrency(result.servicePrice)}</span>
        </div>
        <div className="flex justify-between px-[15px] py-[10px] border-b border-offwhite/8">
          <span className="font-body font-light text-2xs text-offwhite/45">
            Complementos{result.complementNames.length > 0 ? ` (${result.complementNames.join(', ')})` : ''}
          </span>
          <span className="font-body font-light text-2xs text-offwhite">{formatCurrency(result.complementsPrice)}</span>
        </div>
        <div className="flex justify-between px-[15px] py-[10px]">
          <span className="font-body font-normal text-2xs text-gold uppercase tracking-[0.1em]">Total</span>
          <span className="font-data text-sm text-gold">{formatCurrency(result.totalPrice)}</span>
        </div>
      </div>

      <a
        href={result.wppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group inline-flex items-center gap-3',
          'font-body font-light text-[8.5px] tracking-[0.35em] uppercase',
          'text-charcoal-deep bg-sage px-[22px] py-[13px]',
          'transition-all duration-300 hover:bg-sage-light hover:-translate-y-px'
        )}
      >
        Confirmar no WhatsApp
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </a>
      <button
        onClick={onRestart}
        className="block mt-[14px] bg-transparent border-none w-full text-left font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/20 py-[6px] cursor-pointer hover:text-offwhite/45 transition-colors underline underline-offset-4 decoration-offwhite/8"
      >
        Fazer novo agendamento
      </button>
    </div>
  )
}

/* ── Modal ─────────────────────────────────────── */
export function BookingModal({ isOpen, presetServiceSlug, onClose }: { isOpen: boolean; presetServiceSlug?: string | null; onClose: () => void }) {
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [availability,  setAvailability]  = useState<AvailabilityMap>({})
  const [loadingAvail,  setLoadingAvail]  = useState(false)
  const [services,      setServices]      = useState<Service[]>([])
  const [complements,   setComplements]   = useState<Complement[]>([])
  const [state,         setState]         = useState<BookingState>({
    step: 'service', selectedService: null, selectedComplementIds: [], selectedDate: null, selectedSlot: null, result: null,
  })
  const lastFocusRef = useRef<HTMLElement | null>(null)

  const reset = useCallback(() => {
    setCurrentMonth(new Date())
    setAvailability({})
    setComplements([])
    setState({ step: 'service', selectedService: null, selectedComplementIds: [], selectedDate: null, selectedSlot: null, result: null })
  }, [])

  // Fetch services once on open
  useEffect(() => {
    if (!isOpen || services.length > 0) return
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServices(d.services ?? []))
      .catch(console.error)
  }, [isOpen, services.length])

  // Fetch availability whenever month changes, modal opens, or the chosen service (duration) changes
  useEffect(() => {
    if (!isOpen || state.step !== 'schedule' || !state.selectedService) return
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth() + 1
    setLoadingAvail(true)
    fetch(`/api/availability?year=${y}&month=${m}&duration=${state.selectedService.duration}`)
      .then(r => r.json())
      .then(d => setAvailability(d.availability ?? {}))
      .catch(console.error)
      .finally(() => setLoadingAvail(false))
  }, [isOpen, currentMonth, state.step, state.selectedService])

  useEffect(() => {
    if (isOpen) {
      lastFocusRef.current = document.activeElement as HTMLElement
      reset()
    } else {
      lastFocusRef.current?.focus()
    }
  }, [isOpen, reset])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleExclusive = () => {
    window.open(buildExclusiveRequestUrl(), '_blank', 'noopener,noreferrer')
  }

  const selectService = (service: Service) => {
    setState(s => ({ ...s, selectedService: service, selectedComplementIds: [], step: 'complements' }))
    setComplements([])
    fetch(`/api/complements?serviceId=${service.id}`)
      .then(r => r.json())
      .then(d => {
        const list: Complement[] = d.complements ?? []
        setComplements(list)
        // No complements available for this service — skip straight to scheduling
        if (list.length === 0) setState(s => ({ ...s, step: 'schedule' }))
      })
      .catch(() => setState(s => ({ ...s, step: 'schedule' })))
  }

  // Auto-select the preset service (e.g. from a "Agendar" button on a
  // specific service card) once services have loaded, but only while
  // still on the initial step — never hijack a selection already in progress.
  useEffect(() => {
    if (!isOpen || !presetServiceSlug || services.length === 0 || state.step !== 'service') return
    const match = services.find(s => s.slug === presetServiceSlug)
    if (match) {
      if (match.is_whatsapp_only) handleExclusive()
      else selectService(match)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, presetServiceSlug, services, state.step])

  const toggleComplement = (id: string) => {
    setState(s => ({
      ...s,
      selectedComplementIds: s.selectedComplementIds.includes(id)
        ? s.selectedComplementIds.filter(c => c !== id)
        : [...s.selectedComplementIds, id],
    }))
  }

  const confirmComplements = () => {
    setState(s => ({ ...s, step: 'schedule' }))
  }

  const selectDay = (date: Date) => {
    setState(s => ({ ...s, selectedDate: date, selectedSlot: null }))
  }

  const selectSlot = (slot: Slot) => {
    setState(s => ({ ...s, selectedSlot: slot, step: 'details' }))
  }

  const handleChangeMonth = (dir: 1 | -1) => {
    const next = dir === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1)
    setCurrentMonth(next)
    setState(s => ({ ...s, selectedDate: null, selectedSlot: null }))
  }

  const handleConfirm = (data: {
    name: string; whatsapp: string; email: string
    complementNames: string[]; servicePrice: number; complementsPrice: number; totalPrice: number
    date: string; startTime: string
  }) => {
    if (!state.selectedService) return
    const wppUrl = buildBookingConfirmationUrl({
      clientName:      data.name,
      serviceName:     state.selectedService.name,
      complementNames: data.complementNames,
      totalPrice:      data.totalPrice,
      date:            data.date,
      startTime:       data.startTime,
    })

    setState(s => ({
      ...s,
      step: 'success',
      result: {
        clientName:       data.name,
        serviceName:      state.selectedService!.name,
        complementNames:  data.complementNames,
        servicePrice:     data.servicePrice,
        complementsPrice: data.complementsPrice,
        totalPrice:       data.totalPrice,
        date:             data.date,
        startTime:        data.startTime,
        wppUrl,
      },
    }))
  }

  const selectedDateStr = state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : null
  const currentSlots = selectedDateStr ? (availability[selectedDateStr]?.slots ?? []) : []

  const backTo = (step: Step) => setState(s => ({ ...s, step }))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className={cn(
        'fixed inset-0 z-[500] flex items-center justify-center p-4',
        'bg-charcoal-deep/90 backdrop-blur-[12px]',
        'transition-opacity duration-420 ease-brand-out',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'bg-charcoal w-full max-w-[880px] max-h-[92vh] overflow-y-auto',
          'border border-offwhite/7',
          'scrollbar-thin transition-transform duration-460 ease-brand-out',
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-[0.98]'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-charcoal z-10 px-[22px] py-[26px] md:px-11 md:py-[34px] border-b border-offwhite/6 flex justify-between items-start">
          <div>
            <h2 id="modal-title" className="font-display font-light text-[30px] text-offwhite tracking-[0.04em] leading-[1.1]">
              Escolha seu momento.
            </h2>
            <p className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/28 mt-[5px]">
              Agendamento online · Confirmação via WhatsApp
            </p>
            <div className="mt-[18px]">
              <StepDots current={state.step} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-[34px] h-[34px] border border-offwhite/10 text-offwhite/30 text-[15px] flex items-center justify-center shrink-0 transition-all duration-200 hover:border-offwhite/30 hover:text-offwhite hover:bg-offwhite/4"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-[22px] py-[26px] md:px-11 md:py-[34px]">
          {(state.step === 'service' || state.step === 'complements') && (
            <div className="max-w-[520px]">
              {state.step === 'complements' && state.selectedService ? (
                <>
                  <button
                    onClick={() => backTo('service')}
                    className="mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
                  >
                    ← Trocar serviço
                  </button>
                  <ComplementsPicker
                    complements={complements}
                    selected={state.selectedComplementIds}
                    onToggle={toggleComplement}
                    onContinue={confirmComplements}
                  />
                </>
              ) : (
                <ServicePicker services={services} onSelect={selectService} onExclusive={handleExclusive} />
              )}
            </div>
          )}

          {state.step === 'schedule' && state.selectedService && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[26px] md:gap-[52px]">
              <div>
                <button
                  onClick={() => backTo('service')}
                  className="mb-[14px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
                >
                  ← Trocar serviço
                </button>
                <MiniCalendar
                  current={currentMonth}
                  selected={state.selectedDate}
                  availability={availability}
                  loading={loadingAvail}
                  onSelectDay={selectDay}
                  onChangeMonth={handleChangeMonth}
                />
                {state.selectedDate && (
                  <SlotPicker
                    date={state.selectedDate}
                    slots={currentSlots}
                    selected={state.selectedSlot}
                    onSelect={selectSlot}
                  />
                )}
              </div>
              <div className="pt-5">
                <p className="font-display font-light text-[19px] text-offwhite/22 leading-[1.65] italic">
                  Selecione uma data<br />no calendário.
                </p>
                <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/15 mt-4">
                  Escolha o dia → depois o horário
                </p>
              </div>
            </div>
          )}

          {state.step === 'details' && state.selectedService && state.selectedDate && state.selectedSlot && (
            <div className="max-w-[420px]">
              <button
                onClick={() => backTo('schedule')}
                className="mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
              >
                ← Ajustar data/horário
              </button>
              <BookingForm
                selectedDate={state.selectedDate}
                selectedSlot={state.selectedSlot}
                service={state.selectedService}
                complementIds={state.selectedComplementIds}
                onConfirm={handleConfirm}
              />
            </div>
          )}

          {state.step === 'success' && state.result && (
            <div className="max-w-[420px]">
              <Confirmation result={state.result} onRestart={reset} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
