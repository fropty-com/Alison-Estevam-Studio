'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn, formatCurrency, maskPhoneInput, isFullName } from '@/lib/utils'
import { buildBookingConfirmationUrl, buildExclusiveRequestUrl } from '@/lib/whatsapp/messages'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BOOKING } from '@/config/booking'
import { BRAND } from '@/config/brand'
import { buildIcsDataUrl } from '@/lib/calendar/ics'
import { ClientHeader } from '@/components/layout/ClientHeader'

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
  price: number | null
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

type Step = 'service' | 'complements' | 'schedule' | 'details' | 'summary' | 'success'

interface ClientData {
  name: string
  whatsapp: string
  email: string
}

interface BookingState {
  step: Step
  selectedService: Service | null
  selectedComplementIds: string[]
  selectedDate: Date | null
  selectedSlot: Slot | null
  client: ClientData | null
  result: {
    clientName:      string
    serviceName:     string
    complementNames: string[]
    servicePrice:    number
    complementsPrice: number
    totalPrice:      number
    date:            string
    startTime:       string
    duration:        number
    wppUrl:          string
  } | null
}

// The 4 real screens the user moves through — "success" is a distinct
// final screen (matching the prototype) and isn't given a dot.
const STEP_ORDER: Step[] = ['service', 'schedule', 'details', 'summary']

/* ── Back link — matches the prototype's per-step "← ..." pattern ── */
function BackLink({ children, ...props }: { children: React.ReactNode; href?: string; onClick?: () => void }) {
  const cls = 'mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors inline-block'
  if (props.href) {
    return <Link href={props.href} className={cls}>{children}</Link>
  }
  return <button onClick={props.onClick} className={cls}>{children}</button>
}

/* ── Step indicator — thin gold line segments, no numbers/labels ── */
function StepDots({ current }: { current: Step }) {
  const displayStep = current === 'complements' ? 'service' : current
  const idx = STEP_ORDER.indexOf(displayStep)
  return (
    <div className="flex gap-[6px]" aria-label="Etapas do agendamento">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          className={cn('h-[2px] flex-1 transition-colors duration-300', i <= idx ? 'bg-gold' : 'bg-offwhite/15')}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/* ── Step header — eyebrow + title + subtitle, changes per step ── */
function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-[22px]">
      <p className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/28 mb-[6px]">
        {eyebrow}
      </p>
      <h2 className="font-display font-light text-[26px] text-offwhite tracking-[0.02em] leading-[1.15] mb-[6px]">
        {title}
      </h2>
      <p className="font-body font-light text-[12px] text-offwhite/40">
        {subtitle}
      </p>
    </div>
  )
}

/* ── Service picker — select highlights, a separate Continue commits ── */
function ServicePicker({
  services,
  highlighted,
  onHighlight,
  onContinue,
}: {
  services: Service[]
  highlighted: Service | null
  onHighlight: (service: Service) => void
  onContinue: () => void
}) {
  if (services.length === 0) {
    return (
      <p className="font-body font-light text-[11px] text-offwhite/30 italic">
        Carregando serviços…
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-[10px] mb-[22px]">
        {services.map(s => {
          const isSel = highlighted?.id === s.id
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              onClick={() => onHighlight(s)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHighlight(s) } }}
              className={cn(
                'border px-[18px] py-[16px] cursor-pointer',
                'flex items-center justify-between gap-4',
                'transition-all duration-200',
                isSel ? 'border-gold bg-gold/8' : 'border-offwhite/14 hover:border-gold hover:bg-gold/6',
              )}
            >
              <div>
                <p className="font-display font-light text-lg text-offwhite tracking-[0.03em]">
                  {s.is_whatsapp_only
                    ? <>Atendimento <span className="text-gold">Exclusivo</span></>
                    : s.name}
                </p>
                <p className="font-body font-light text-2xs tracking-[0.18em] uppercase text-offwhite/35 mt-1">
                  {s.is_whatsapp_only ? 'Combinado via WhatsApp' : `${s.duration >= 60 ? `${Math.floor(s.duration / 60)}h${s.duration % 60 ? s.duration % 60 : ''}` : `${s.duration} min`}`}
                </p>
              </div>
              <span className="font-data text-lg text-gold shrink-0">{formatCurrency(s.price)}</span>
            </div>
          )
        })}
      </div>
      <button
        onClick={onContinue}
        disabled={!highlighted}
        className={cn(
          'w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
          'bg-gold text-charcoal-deep transition-all duration-300',
          'hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gold',
        )}
      >
        {highlighted?.is_whatsapp_only ? 'Chamar no WhatsApp' : 'Continuar'}
      </button>
    </div>
  )
}

/* ── Complements — rendered as a modal overlaying the (blurred) service list ── */
function ComplementsOverlay({
  complements,
  selected,
  onToggle,
  onContinue,
  onClose,
}: {
  complements: Complement[]
  selected: string[]
  onToggle: (id: string) => void
  onContinue: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-charcoal-deep/45" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-[440px] max-h-[82vh] overflow-y-auto bg-charcoal border border-offwhite/14 p-[30px]">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-[22px] right-[22px] w-8 h-8 border border-offwhite/18 text-offwhite/45 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
        >
          ✕
        </button>

        <span className="inline-block font-body font-light text-2xs tracking-[0.2em] uppercase text-offwhite/40 border border-offwhite/20 px-[10px] py-[3px] mb-[14px]">
          Opcional
        </span>
        <h2 className="font-display font-light text-2xl text-offwhite tracking-[0.02em] mb-[6px]">
          Complementos
        </h2>
        <p className="font-body font-light text-[12px] text-offwhite/45 mb-[18px] leading-[1.7]">
          Adicione um cuidado extra ao seu horário, se quiser — não é obrigatório.
        </p>

        {complements.length === 0 ? (
          <p className="font-body font-light text-[12px] text-offwhite/35 italic mb-[22px]">
            Nenhum complemento disponível para este serviço.
          </p>
        ) : (
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
                  <span className="font-data text-sm text-gold shrink-0 whitespace-nowrap">{formatCurrency(c.price)}</span>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light"
        >
          {selected.length > 0 ? 'Continuar' : 'Continuar sem complementos'}
        </button>
      </div>
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
              'hover:border-gold hover:text-gold hover:bg-gold/7',
              'disabled:opacity-20 disabled:pointer-events-none'
            )}
          >‹</button>
          <button
            onClick={() => onChangeMonth(1)}
            aria-label="Próximo mês"
            className={cn(
              'w-7 h-7 border border-offwhite/10 text-offwhite/32 text-[13px]',
              'flex items-center justify-center transition-all duration-200',
              'hover:border-gold hover:text-gold hover:bg-gold/7'
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
                'aspect-square flex items-center justify-center relative rounded-full',
                'font-body font-light text-[11.5px]',
                'border border-transparent transition-all duration-200',
                past        && 'opacity-[0.18] pointer-events-none select-none',
                unavailable && 'opacity-[0.28] cursor-default select-none',
                !disabled   && 'text-offwhite/75 cursor-pointer hover:bg-gold/12 hover:text-gold hover:border-gold/30',
                todayDay    && !disabled && !isSelected && 'text-offwhite border-offwhite/30 font-normal',
                isSelected  && 'bg-gold text-charcoal-deep border-gold font-normal',
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
  serviceId,
  slots,
  selected,
  onSelect,
}: {
  date:      Date
  serviceId: string
  slots:     Slot[]
  selected:  Slot | null
  onSelect:  (slot: Slot) => void
}) {
  const available = slots.filter(s => s.available)

  if (available.length === 0) {
    return (
      <div className="mt-[18px]">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/22 mb-[10px]">
          {format(date, "d 'de' MMMM", { locale: ptBR })} — sem horários
        </p>
        <p className="font-body font-light text-[11px] text-offwhite/30 italic mb-[16px]">
          Nenhum horário disponível para esta data com este serviço.
        </p>
        <WaitlistForm date={date} serviceId={serviceId} />
      </div>
    )
  }

  return (
    <div className="mt-[18px]">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-gold/70 mb-[10px]">
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
                !isSel && 'text-offwhite/65 border-offwhite/14 hover:border-gold hover:text-gold hover:bg-gold/8',
                isSel && 'bg-gold border-gold text-charcoal-deep',
              )}
            >
              {slot.startTime}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Waitlist — shown when there are no slots for the chosen date ── */
function WaitlistForm({ date, serviceId }: { date: Date; serviceId: string }) {
  const [open,     setOpen]     = useState(false)
  const [name,     setName]     = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  if (done) {
    return (
      <p className="font-body font-light text-[11px] text-sage-light/80 italic">
        Você entrou na fila de espera. Avisamos por WhatsApp assim que abrir um horário nesse dia.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-gold/70 hover:text-gold transition-colors underline underline-offset-4"
      >
        Avisar quando abrir horário
      </button>
    )
  }

  const handleSubmit = async () => {
    setError(null)
    if (!isFullName(name)) { setError('Informe nome e sobrenome.'); return }
    if (whatsapp.replace(/\D/g, '').length !== 11) { setError('Informe o WhatsApp com DDD + 9 dígitos.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          serviceId,
          preferredDate: format(date, 'yyyy-MM-dd'),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Erro ao entrar na fila. Tente novamente.')
        return
      }
      setDone(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-offwhite/10 p-4">
      <p className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/50 mb-3">
        Entrar na fila de espera
      </p>
      <div className="flex flex-col gap-[10px]">
        <input
          type="text"
          autoComplete="name"
          placeholder="Nome e sobrenome"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-sm px-[13px] py-[10px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none placeholder:text-offwhite/35"
        />
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          maxLength={15}
          value={whatsapp}
          onChange={e => setWhatsapp(maskPhoneInput(e.target.value))}
          className="w-full bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-sm px-[13px] py-[10px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none placeholder:text-offwhite/35"
        />
        {error && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-[12px] font-body font-medium text-[9px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep hover:bg-gold-light transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Entrar na fila'}
        </button>
      </div>
    </div>
  )
}

/* ── "Seus dados" — collects client info, no submit here ─────── */
function DetailsForm({
  initial,
  onContinue,
}: {
  initial: ClientData | null
  onContinue: (data: ClientData) => void
}) {
  const [name,     setName]     = useState(initial?.name ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '')
  const [email,    setEmail]    = useState(initial?.email ?? '')
  const [errors,   setErrors]   = useState<Record<string, string>>({})

  const handleContinue = () => {
    const e: Record<string, string> = {}
    if (!isFullName(name))                        e.name     = 'Informe nome e sobrenome.'
    if (whatsapp.replace(/\D/g, '').length !== 11) e.whatsapp = 'Informe o WhatsApp com DDD + 9 dígitos.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onContinue({ name: name.trim(), whatsapp: whatsapp.trim(), email: email.trim() })
  }

  return (
    <div>
      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]" htmlFor="f-nome">
          Nome completo
        </label>
        <input
          id="f-nome"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Nome e sobrenome"
          value={name}
          onChange={e => setName(e.target.value)}
          className={cn(
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-sm px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/35 placeholder:font-body placeholder:font-light',
            errors.name ? 'border-error/55' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5'
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
          maxLength={15}
          value={whatsapp}
          onChange={e => setWhatsapp(maskPhoneInput(e.target.value))}
          className={cn(
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-sm px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/35 placeholder:font-body placeholder:font-light',
            errors.whatsapp ? 'border-error/55' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5'
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
            errors.email ? 'border-error/55' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5'
          )}
        />
        {errors.email && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.email}</p>}
      </div>

      <button
        onClick={handleContinue}
        className={cn(
          'w-full mt-[10px] py-[16px]',
          'font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
          'bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light',
        )}
      >
        Continuar
      </button>
    </div>
  )
}

/* ── Summary — review + the actual submit ─────────────────────── */
function SummaryStep({
  selectedDate,
  selectedSlot,
  service,
  complementIds,
  complements,
  client,
  onConfirm,
}: {
  selectedDate:  Date
  selectedSlot:  Slot
  service:       Service
  complementIds: string[]
  complements:   Complement[]
  client:        ClientData
  onConfirm: (data: {
    complementNames: string[]; servicePrice: number; complementsPrice: number; totalPrice: number
    date: string; startTime: string
  }) => void
}) {
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [couponInput,   setCouponInput]   = useState('')
  const [couponPending, setCouponPending] = useState(false)
  const [couponError,   setCouponError]   = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null)

  const chosen = complements.filter(c => complementIds.includes(c.id))
  const complementsPrice = chosen.reduce((sum, c) => sum + (c.price ?? 0), 0)
  const subtotal = service.price + complementsPrice
  const totalPrice = Math.max(0, subtotal - (appliedCoupon?.discountAmount ?? 0))
  const dateLabel = format(selectedDate, "d 'de' MMMM", { locale: ptBR })

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponPending(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      })
      const data = await res.json()
      if (!data.valid) {
        setCouponError(data.error ?? 'Cupom inválido.')
        setAppliedCoupon(null)
        return
      }
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, label: data.discountLabel })
    } catch {
      setCouponError('Erro de conexão. Tente novamente.')
    } finally {
      setCouponPending(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:      client.name,
          whatsapp:  client.whatsapp,
          email:     client.email || undefined,
          serviceId: service.id,
          slotId:    selectedSlot.id,
          complementIds,
          couponCode: appliedCoupon?.code || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? 'Erro ao confirmar agendamento. Tente novamente.')
        return
      }
      onConfirm({
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

  return (
    <div>
      <div className="border border-offwhite/10 mb-[26px]">
        <div className="flex justify-between px-[18px] py-[13px] border-b border-offwhite/8">
          <span className="font-body font-light text-[12px] text-offwhite/45">Serviço</span>
          <span className="font-body font-light text-[12px] text-offwhite">{service.name}</span>
        </div>
        <div className="flex justify-between px-[18px] py-[13px] border-b border-offwhite/8">
          <span className="font-body font-light text-[12px] text-offwhite/45">Complementos</span>
          <span className="font-body font-light text-[12px] text-offwhite text-right">
            {chosen.length > 0 ? chosen.map(c => c.name).join(', ') : 'Nenhum'}
          </span>
        </div>
        <div className="flex justify-between px-[18px] py-[13px] border-b border-offwhite/8">
          <span className="font-body font-light text-[12px] text-offwhite/45">Data</span>
          <span className="font-body font-light text-[12px] text-offwhite">{dateLabel}</span>
        </div>
        <div className="flex justify-between px-[18px] py-[13px] border-b border-offwhite/8">
          <span className="font-body font-light text-[12px] text-offwhite/45">Horário</span>
          <span className="font-body font-light text-[12px] text-offwhite">{selectedSlot.startTime}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-center px-[18px] py-[13px] border-b border-offwhite/8">
            <span className="font-body font-light text-[12px] text-sage-light">
              Cupom {appliedCoupon.code}
              <button
                onClick={() => { setAppliedCoupon(null); setCouponInput(''); setCouponError(null) }}
                className="ml-2 text-offwhite/30 hover:text-offwhite/60 underline underline-offset-2 text-[10px]"
              >
                remover
              </button>
            </span>
            <span className="font-body font-light text-[12px] text-sage-light">−{formatCurrency(appliedCoupon.discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between px-[18px] py-[13px]">
          <span className="font-body font-normal text-[12px] text-gold uppercase tracking-[0.1em]">Valor</span>
          <span className="font-data text-lg text-gold">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      {!appliedCoupon && (
        <div className="mb-[16px]">
          <div className="flex gap-[8px]">
            <input
              type="text"
              value={couponInput}
              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
              placeholder="Cupom de desconto (opcional)"
              className="flex-1 bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-sm px-[15px] py-[12px] outline-none rounded-none placeholder:text-offwhite/35 focus:border-gold focus:bg-gold/5 transition-all duration-250"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponPending || !couponInput.trim()}
              className="px-5 font-body font-medium text-[9.5px] tracking-[0.2em] uppercase border border-offwhite/25 text-offwhite/60 hover:border-gold/50 hover:text-gold transition-all duration-200 disabled:opacity-40"
            >
              {couponPending ? '…' : 'Aplicar'}
            </button>
          </div>
          {couponError && (
            <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-[8px]">{couponError}</p>
          )}
        </div>
      )}

      {apiError && (
        <div className="mb-[16px] px-[15px] py-[12px] border border-error/30 bg-error/5">
          <p className="font-body font-light text-[10px] tracking-[0.18em] text-error/80">{apiError}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={cn(
          'w-full py-[17px]',
          'font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
          'bg-gold text-charcoal-deep',
          'transition-all duration-300',
          'hover:bg-gold-light hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(203,163,57,0.30)]',
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
        ) : 'Confirmar agendamento'}
      </button>
    </div>
  )
}

/* ── Success ───────────────────────────────────── */
function Confirmation({
  result,
}: {
  result: NonNullable<BookingState['result']>
}) {
  return (
    <div className="animate-fade-up min-h-[calc(100vh-122px)] pt-[122px] flex flex-col items-center justify-center text-center px-8">
      <div className="w-[64px] h-[64px] rounded-full border-[1.5px] border-gold flex items-center justify-center text-gold text-[22px] mb-[26px]">
        ✓
      </div>
      <h2 className="font-display font-light text-3xl text-offwhite leading-[1.2] mb-[12px]">
        Agendamento confirmado
      </h2>
      <p className="font-body font-light text-[13px] text-offwhite/45 mb-[30px] leading-[1.7] max-w-[300px]">
        Você vai receber a confirmação pelo WhatsApp informado. Até breve.
      </p>

      <a
        href={result.wppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group inline-flex items-center gap-3',
          'font-body font-medium text-[8.5px] tracking-[0.35em] uppercase',
          'text-charcoal-deep bg-gold px-[24px] py-[14px]',
          'transition-all duration-300 hover:bg-gold-light hover:-translate-y-px'
        )}
      >
        Confirmar no WhatsApp
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </a>

      <a
        href={buildIcsDataUrl({
          title:           `${result.serviceName} — ${BRAND.name}`,
          date:            result.date,
          startTime:       result.startTime,
          durationMinutes: result.duration,
        })}
        download="agendamento-alison-estevam.ics"
        className="mt-[14px] font-body font-light text-[9px] tracking-[0.25em] uppercase text-offwhite/40 hover:text-offwhite/70 transition-colors underline underline-offset-4 decoration-offwhite/15"
      >
        Adicionar ao calendário
      </a>

      <Link
        href="/conta"
        className="block mt-[16px] mx-auto bg-transparent border-none text-center font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/30 py-[6px] cursor-pointer hover:text-offwhite/55 transition-colors underline underline-offset-4 decoration-offwhite/10"
      >
        Voltar ao início
      </Link>
    </div>
  )
}

/* ── Page flow ─────────────────────────────────── */
export function AgendarFlow({ initialClient = null }: { initialClient?: ClientData | null }) {
  const searchParams = useSearchParams()
  const presetServiceSlug = searchParams.get('servico')

  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [availability,  setAvailability]  = useState<AvailabilityMap>({})
  const [loadingAvail,  setLoadingAvail]  = useState(false)
  const [services,      setServices]      = useState<Service[]>([])
  const [complements,   setComplements]   = useState<Complement[]>([])
  const [state,         setState]         = useState<BookingState>({
    step: 'service', selectedService: null, selectedComplementIds: [], selectedDate: null, selectedSlot: null, client: initialClient, result: null,
  })

  // Fetch services once on mount
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServices(d.services ?? []))
      .catch(console.error)
  }, [])

  // Fetch availability whenever month changes or the chosen service (duration) changes
  useEffect(() => {
    if (state.step !== 'schedule' || !state.selectedService) return
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth() + 1
    setLoadingAvail(true)
    fetch(`/api/availability?year=${y}&month=${m}&duration=${state.selectedService.duration}`)
      .then(r => r.json())
      .then(d => setAvailability(d.availability ?? {}))
      .catch(console.error)
      .finally(() => setLoadingAvail(false))
  }, [currentMonth, state.step, state.selectedService])

  const handleExclusive = () => {
    window.open(buildExclusiveRequestUrl(), '_blank', 'noopener,noreferrer')
  }

  // Highlight only — the service isn't "committed" until Continue is clicked
  const highlightService = (service: Service) => {
    setState(s => ({ ...s, selectedService: service }))
  }

  // Commit the highlighted service: whatsapp-only goes straight to WhatsApp,
  // everything else fetches its complements and opens that overlay.
  const commitService = useCallback((service: Service) => {
    if (service.is_whatsapp_only) { handleExclusive(); return }
    setState(s => ({ ...s, selectedService: service, selectedComplementIds: [], step: 'complements' }))
    setComplements([])
    fetch(`/api/complements?serviceId=${service.id}`)
      .then(r => r.json())
      .then(d => {
        const list: Complement[] = d.complements ?? []
        setComplements(list)
        if (list.length === 0) setState(s => ({ ...s, step: 'schedule' }))
      })
      .catch(() => setState(s => ({ ...s, step: 'schedule' })))
  }, [])

  // Auto-select the preset service (e.g. from a "Agendar" button on a
  // specific service card) once services have loaded, but only while
  // still on the initial step — never hijack a selection already in progress.
  useEffect(() => {
    if (!presetServiceSlug || services.length === 0 || state.step !== 'service') return
    const match = services.find(s => s.slug === presetServiceSlug)
    if (match) commitService(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetServiceSlug, services, state.step])

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
    // Already logged in as a client — no reason to ask for name/whatsapp/email
    // again, so skip straight to the summary. Still reachable via "Ajustar
    // seus dados" on the summary step if they need to correct something.
    setState(s => ({
      ...s,
      selectedSlot: slot,
      step: initialClient ? 'summary' : 'details',
    }))
  }

  const handleChangeMonth = (dir: 1 | -1) => {
    const next = dir === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1)
    setCurrentMonth(next)
    setState(s => ({ ...s, selectedDate: null, selectedSlot: null }))
  }

  const handleDetailsContinue = (client: ClientData) => {
    setState(s => ({ ...s, client, step: 'summary' }))
  }

  const handleConfirm = (data: {
    complementNames: string[]; servicePrice: number; complementsPrice: number; totalPrice: number
    date: string; startTime: string
  }) => {
    if (!state.selectedService || !state.client) return
    const wppUrl = buildBookingConfirmationUrl({
      clientName:      state.client.name,
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
        clientName:       state.client!.name,
        serviceName:      state.selectedService!.name,
        complementNames:  data.complementNames,
        servicePrice:     data.servicePrice,
        complementsPrice: data.complementsPrice,
        totalPrice:       data.totalPrice,
        date:             data.date,
        startTime:        data.startTime,
        duration:         state.selectedService!.duration,
        wppUrl,
      },
    }))
  }

  const selectedDateStr = state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : null
  const currentSlots = selectedDateStr ? (availability[selectedDateStr]?.slots ?? []) : []

  const backTo = (step: Step) => setState(s => ({ ...s, step }))

  const headerFor: Record<Exclude<Step, 'success'>, { eyebrow: string; title: string; subtitle: string }> = {
    service: {
      eyebrow: 'Agendamento',
      title: 'Escolha o serviço',
      subtitle: 'Selecione o que você deseja agendar hoje.',
    },
    complements: {
      eyebrow: 'Agendamento',
      title: 'Escolha o serviço',
      subtitle: 'Selecione o que você deseja agendar hoje.',
    },
    schedule: {
      eyebrow: 'Agendamento',
      title: 'Escolha data e horário',
      subtitle: state.selectedService ? `Horários disponíveis para ${state.selectedService.name}.` : 'Horários disponíveis.',
    },
    details: {
      eyebrow: 'Agendamento',
      title: 'Seus dados',
      subtitle: 'Precisamos de alguns dados para confirmar seu horário.',
    },
    summary: {
      eyebrow: 'Agendamento',
      title: 'Confirme seu horário',
      subtitle: 'Revise os detalhes antes de confirmar.',
    },
  }

  if (state.step === 'success' && state.result) {
    return (
      <>
        <ClientHeader />
        <Confirmation result={state.result} />
      </>
    )
  }

  return (
    <>
    <ClientHeader />
    <div className="px-8 pt-[122px] pb-16">
      {(state.step === 'service' || state.step === 'complements') && (
        <BackLink href="/">← Voltar ao início</BackLink>
      )}
      {state.step === 'schedule' && <BackLink onClick={() => backTo('service')}>← Trocar serviço</BackLink>}
      {state.step === 'details'  && <BackLink onClick={() => backTo('schedule')}>← Ajustar data/horário</BackLink>}
      {state.step === 'summary'  && <BackLink onClick={() => backTo('details')}>← Ajustar seus dados</BackLink>}

      <StepHeader {...headerFor[state.step as Exclude<Step, 'success'>]} />
      <StepDots current={state.step} />

      <div className="mt-[26px] relative">
        {(state.step === 'service' || state.step === 'complements') && (
          <ServicePicker
            services={services}
            highlighted={state.selectedService}
            onHighlight={highlightService}
            onContinue={() => state.selectedService && commitService(state.selectedService)}
          />
        )}

        {state.step === 'complements' && (
          <ComplementsOverlay
            complements={complements}
            selected={state.selectedComplementIds}
            onToggle={toggleComplement}
            onContinue={confirmComplements}
            onClose={() => backTo('service')}
          />
        )}

        {state.step === 'schedule' && state.selectedService && (
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
                serviceId={state.selectedService.id}
                slots={currentSlots}
                selected={state.selectedSlot}
                onSelect={selectSlot}
              />
            )}
          </div>
        )}

        {state.step === 'details' && state.selectedService && state.selectedDate && state.selectedSlot && (
          <DetailsForm initial={state.client} onContinue={handleDetailsContinue} />
        )}

        {state.step === 'summary' && state.selectedService && state.selectedDate && state.selectedSlot && state.client && (
          <SummaryStep
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            service={state.selectedService}
            complementIds={state.selectedComplementIds}
            complements={complements}
            client={state.client}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
    </>
  )
}
