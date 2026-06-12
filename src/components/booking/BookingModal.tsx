'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { buildBookingConfirmationUrl } from '@/lib/whatsapp/messages'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, parseISO, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BOOKING } from '@/config/booking'

/* ── Types ─────────────────────────────────────── */
interface Service {
  id: string
  name: string
  price: number
  duration: number
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

interface BookingState {
  step: 1 | 2 | 3
  selectedDate: Date | null
  selectedSlot: Slot | null
  result: {
    clientName:    string
    serviceName:   string
    date:          string
    startTime:     string
    referenceCode: string
    whatsapp:      string
    wppUrl:        string
  } | null
}

/* ── Step indicator ────────────────────────────── */
function StepDot({ num, status }: { num: number; status: 'active' | 'done' | 'idle' }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0',
        'font-body font-light text-[9px] transition-all duration-300',
        status === 'active' && 'border-gold text-gold bg-gold/8',
        status === 'done'   && 'border-sage bg-sage text-offwhite',
        status === 'idle'   && 'border-offwhite/14 text-offwhite/22',
      )}>
        {status === 'done' ? '✓' : num}
      </div>
      <span className={cn(
        'font-body font-light text-[8px] tracking-[0.24em] uppercase transition-colors duration-300',
        status === 'active' && 'text-offwhite/55',
        status === 'done'   && 'text-sage-light',
        status === 'idle'   && 'text-offwhite/22',
      )}>
        {num === 1 ? 'Data & Horário' : num === 2 ? 'Seus Dados' : 'Confirmação'}
      </span>
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
    const disabled = past || (info !== undefined ? !info.available : BOOKING.blockedWeekdays.includes(d.getDay()))
    return { day: i + 1, date: d, dateStr, disabled, hasSlots: info?.available ?? false }
  })

  return (
    <div className="bg-offwhite/3 border border-offwhite/7 p-[26px] rounded-none">
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
              'disabled:opacity-18 disabled:pointer-events-none'
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
          <span key={i} className="text-center font-body font-light text-[8.5px] tracking-[0.15em] uppercase text-offwhite/18 py-[5px]">
            {d}
          </span>
        ))}
      </div>

      <div className={cn('grid grid-cols-7 gap-[3px] transition-opacity duration-300', loading && 'opacity-40')} role="grid">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} aria-hidden="true" />)}
        {days.map(({ day, date, dateStr, disabled }) => {
          const isSelected = selected && format(selected, 'yyyy-MM-dd') === dateStr
          const todayDay   = dateStr === format(today, 'yyyy-MM-dd')
          return (
            <div
              key={day}
              role="gridcell"
              aria-label={`${day} de ${format(current, 'MMMM', { locale: ptBR })}${disabled ? ' — indisponível' : ''}`}
              aria-disabled={disabled}
              onClick={() => !disabled && onSelectDay(date)}
              className={cn(
                'aspect-square flex items-center justify-center',
                'font-body font-light text-[11.5px] rounded-none',
                'border border-transparent transition-all duration-200',
                disabled   && 'text-offwhite/10 line-through cursor-default',
                !disabled  && 'text-offwhite/48 cursor-pointer hover:bg-sage/13 hover:text-sage-light hover:border-sage/17',
                todayDay   && !disabled && !isSelected && 'text-offwhite border-offwhite/17 font-normal',
                isSelected && 'bg-sage text-offwhite border-sage',
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
  if (slots.length === 0) {
    return (
      <div className="mt-[18px]">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/22 mb-[10px]">
          {format(date, "d 'de' MMMM", { locale: ptBR })} — sem horários
        </p>
        <p className="font-body font-light text-[11px] text-offwhite/30 italic">
          Nenhum horário disponível para esta data.
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
        {slots.map(slot => {
          const isSel = selected?.id === slot.id
          return (
            <div
              key={slot.id}
              role="listitem"
              aria-label={`${slot.startTime}${!slot.available ? ' — ocupado' : ''}`}
              onClick={() => slot.available && onSelect(slot)}
              className={cn(
                'py-[13px] px-[6px] text-center',
                'font-display text-[15px]',
                'border rounded-none transition-all duration-200 select-none',
                !slot.available && 'text-offwhite/10 border-offwhite/7 line-through cursor-default',
                slot.available && !isSel && 'text-offwhite/52 border-offwhite/7 cursor-pointer hover:border-sage hover:text-sage-light hover:bg-sage/7',
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
  services,
  onConfirm,
}: {
  selectedDate: Date
  selectedSlot: Slot
  services:     Service[]
  onConfirm:   (data: {
    name: string; serviceId: string; serviceName: string
    whatsapp: string; email: string; referenceCode: string
    date: string; startTime: string
  }) => void
}) {
  const [name,      setName]      = useState('')
  const [serviceId, setServiceId] = useState('')
  const [whatsapp,  setWhatsapp]  = useState('')
  const [email,     setEmail]     = useState('')
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [loading,   setLoading]   = useState(false)
  const [apiError,  setApiError]  = useState<string | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (name.trim().length < 2)          e.name     = 'Por favor, informe seu nome.'
    if (!serviceId)                       e.service  = 'Selecione um serviço.'
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
          serviceId,
          slotId:    selectedSlot.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? 'Erro ao confirmar agendamento. Tente novamente.')
        return
      }

      const svc = services.find(s => s.id === serviceId)!
      onConfirm({
        name:          name.trim(),
        serviceId,
        serviceName:   svc.name,
        whatsapp:      whatsapp.trim(),
        email:         email.trim(),
        referenceCode: data.referenceCode,
        date:          data.date,
        startTime:     data.startTime,
      })
    } catch {
      setApiError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const dateLabel = format(selectedDate, "d 'de' MMMM", { locale: ptBR })
  const slotLabel = `${dateLabel} às ${selectedSlot.startTime.replace(':', 'h')}`

  return (
    <div>
      <div className="flex items-center gap-[11px] px-[15px] py-[13px] bg-sage/7 border border-sage/16 mb-[22px]">
        <span className="w-[5px] h-[5px] rounded-full bg-sage shrink-0 animate-pulse-dot" aria-hidden="true" />
        <span className="font-body font-light text-2xs tracking-[0.2em] uppercase text-sage-light">
          {slotLabel}
        </span>
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/32 mb-[6px]" htmlFor="f-nome">
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
            'w-full bg-offwhite/3 border text-offwhite font-display text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/18 placeholder:text-sm placeholder:font-body placeholder:font-light',
            errors.name ? 'border-error/55 bg-error/4' : 'border-offwhite/9 focus:border-sage focus:bg-sage/5'
          )}
        />
        {errors.name && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.name}</p>}
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/32 mb-[6px]" htmlFor="f-servico">
          Serviço
        </label>
        <select
          id="f-servico"
          value={serviceId}
          onChange={e => setServiceId(e.target.value)}
          className={cn(
            'w-full bg-offwhite/3 border text-offwhite font-display text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none appearance-none',
            '[&>option]:bg-charcoal-mid [&>option]:text-offwhite',
            errors.service ? 'border-error/55 bg-error/4' : 'border-offwhite/9 focus:border-sage focus:bg-sage/5',
            !serviceId && 'text-offwhite/18 font-body font-light text-sm'
          )}
        >
          <option value="">Selecione o serviço</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatCurrency(s.price)}
            </option>
          ))}
        </select>
        {errors.service && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.service}</p>}
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/32 mb-[6px]" htmlFor="f-tel">
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
            'w-full bg-offwhite/3 border text-offwhite font-display text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/18 placeholder:text-sm placeholder:font-body placeholder:font-light',
            errors.whatsapp ? 'border-error/55 bg-error/4' : 'border-offwhite/9 focus:border-sage focus:bg-sage/5'
          )}
        />
        {errors.whatsapp && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.whatsapp}</p>}
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/32 mb-[6px]" htmlFor="f-email">
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
            'w-full bg-offwhite/3 border text-offwhite font-display text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/18 placeholder:text-sm placeholder:font-body placeholder:font-light',
            errors.email ? 'border-error/55 bg-error/4' : 'border-offwhite/9 focus:border-sage focus:bg-sage/5'
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
          'bg-offwhite text-charcoal',
          'transition-all duration-300',
          'hover:bg-sage hover:text-offwhite',
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
      <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-offwhite/22 mb-[26px]">
        Código: <span className="text-gold">{result.referenceCode}</span>
      </p>
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
export function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [availability,  setAvailability]  = useState<AvailabilityMap>({})
  const [loadingAvail,  setLoadingAvail]  = useState(false)
  const [services,      setServices]      = useState<Service[]>([])
  const [state,         setState]         = useState<BookingState>({
    step: 1, selectedDate: null, selectedSlot: null, result: null,
  })
  const lastFocusRef = useRef<HTMLElement | null>(null)

  const reset = useCallback(() => {
    setCurrentMonth(new Date())
    setAvailability({})
    setState({ step: 1, selectedDate: null, selectedSlot: null, result: null })
  }, [])

  // Fetch services once on open
  useEffect(() => {
    if (!isOpen || services.length > 0) return
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServices(d.services ?? []))
      .catch(console.error)
  }, [isOpen, services.length])

  // Fetch availability whenever month changes or modal opens
  useEffect(() => {
    if (!isOpen) return
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth() + 1
    setLoadingAvail(true)
    fetch(`/api/availability?year=${y}&month=${m}`)
      .then(r => r.json())
      .then(d => setAvailability(d.availability ?? {}))
      .catch(console.error)
      .finally(() => setLoadingAvail(false))
  }, [isOpen, currentMonth])

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

  const selectDay = (date: Date) => {
    setState(s => ({ ...s, selectedDate: date, selectedSlot: null, step: 1 }))
  }

  const selectSlot = (slot: Slot) => {
    setState(s => ({ ...s, selectedSlot: slot, step: 2 }))
  }

  const handleChangeMonth = (dir: 1 | -1) => {
    const next = dir === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1)
    setCurrentMonth(next)
    setState(s => ({ ...s, selectedDate: null, selectedSlot: null, step: 1 }))
  }

  const handleConfirm = (data: {
    name: string; serviceId: string; serviceName: string
    whatsapp: string; email: string; referenceCode: string
    date: string; startTime: string
  }) => {
    const wppUrl = buildBookingConfirmationUrl({
      clientName:    data.name,
      serviceName:   data.serviceName,
      date:          data.date,
      startTime:     data.startTime,
      whatsapp:      data.whatsapp,
      referenceCode: data.referenceCode,
    })

    setState(s => ({
      ...s,
      step: 3,
      result: {
        clientName:    data.name,
        serviceName:   data.serviceName,
        date:          data.date,
        startTime:     data.startTime,
        referenceCode: data.referenceCode,
        whatsapp:      data.whatsapp,
        wppUrl,
      },
    }))
  }

  const stepStatus = (n: 1 | 2 | 3): 'active' | 'done' | 'idle' => {
    if (state.step > n)  return 'done'
    if (state.step === n) return 'active'
    return 'idle'
  }

  const selectedDateStr = state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : null
  const currentSlots = selectedDateStr ? (availability[selectedDateStr]?.slots ?? []) : []

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
            <div className="flex items-center gap-2 mt-[18px]" aria-label="Etapas do agendamento">
              <StepDot num={1} status={stepStatus(1)} />
              <div className="w-[18px] h-px bg-offwhite/8 shrink-0" aria-hidden="true" />
              <StepDot num={2} status={stepStatus(2)} />
              <div className="w-[18px] h-px bg-offwhite/8 shrink-0" aria-hidden="true" />
              <StepDot num={3} status={stepStatus(3)} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[26px] md:gap-[52px] px-[22px] py-[26px] md:px-11 md:py-[34px]">
          {/* Left — Calendar */}
          <div>
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

          {/* Right — Form / Confirmation */}
          <div>
            {state.step === 3 && state.result ? (
              <Confirmation result={state.result} onRestart={reset} />
            ) : state.selectedDate && state.selectedSlot ? (
              <BookingForm
                selectedDate={state.selectedDate}
                selectedSlot={state.selectedSlot}
                services={services}
                onConfirm={handleConfirm}
              />
            ) : (
              <div className="pt-5">
                <p className="font-display font-light text-[19px] text-offwhite/22 leading-[1.65] italic">
                  Selecione uma data<br />no calendário ao lado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
