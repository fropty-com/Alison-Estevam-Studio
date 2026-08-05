'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { cn, formatCurrency, maskPhoneInput, isFullName } from '@/lib/utils'
import { buildBookingConfirmationUrl, buildExclusiveRequestUrl } from '@/lib/whatsapp/messages'
import { format, addMonths, subMonths, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BOOKING } from '@/config/booking'
import { BRAND } from '@/config/brand'
import { buildIcsDataUrl } from '@/lib/calendar/ics'
import { ClientHeader } from '@/components/layout/ClientHeader'
import { MiniCalendar, SlotGrid, type CalendarSlot, type AvailabilityMap } from '@/components/booking/MiniCalendar'
import { BackLink, StepHeader, DetailCard, ServiceListSkeleton } from '@/components/booking/BookingChrome'
import { Button } from '@/components/ui/Button'

/* ── Types ─────────────────────────────────────── */
interface Service {
  id: string
  slug: string
  name: string
  description: string
  price: number
  duration: number
  is_whatsapp_only: boolean
  price_negotiable?: boolean
}

interface Complement {
  id: string
  name: string
  description: string
  price: number | null
}

type Slot = CalendarSlot

type Step = 'service' | 'complements' | 'care' | 'schedule' | 'details' | 'summary' | 'success'

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

/** "10:00" + 90 → "11:30" — used to show the appointment's end time, not just its start. */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + minutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/* ── Step indicator — thin gold line segments. Completed segments (before
   the current step) are clickable and jump straight back to that step,
   same as the "← Voltar" links but from any earlier point at once. ── */
function StepDots({
  current,
  isCareSelected,
  onNavigate,
}: {
  current: Step
  isCareSelected: boolean
  onNavigate: (step: Step) => void
}) {
  const displayStep = (current === 'complements' || current === 'care') ? 'service' : current
  const idx = STEP_ORDER.indexOf(displayStep)

  return (
    <div className="flex gap-[6px]" aria-label="Etapas do agendamento">
      {STEP_ORDER.map((s, i) => {
        const clickable = i < idx
        const target: Step = i === 0 && isCareSelected ? 'care' : s
        return (
          <button
            key={s}
            type="button"
            disabled={!clickable}
            onClick={() => onNavigate(target)}
            aria-label={clickable ? 'Voltar para uma etapa anterior' : undefined}
            className={cn('group flex-1 py-[8px] bg-transparent border-0 outline-none', clickable ? 'cursor-pointer' : 'cursor-default')}
          >
            <span
              className={cn(
                'block h-[2px] w-full transition-colors duration-300',
                i <= idx ? 'bg-gold' : 'bg-offwhite/15',
                clickable && 'group-hover:bg-gold-light',
              )}
            />
          </button>
        )
      })}
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
    return <ServiceListSkeleton />
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
                isSel ? 'border-gold bg-gold/10' : 'border-offwhite/[0.14] hover:border-gold hover:bg-gold/5',
              )}
            >
              <div>
                <p className="font-display font-light text-lg text-offwhite tracking-[0.03em]">
                  {s.slug === 'horario-exclusivo'
                    ? <>Atendimento <span className="text-gold">Exclusivo</span></>
                    : s.name}
                </p>
                <p className="font-body font-light text-2xs tracking-[0.18em] uppercase text-offwhite/55 mt-1">
                  {s.is_whatsapp_only ? 'Combinado via WhatsApp' : `${s.duration >= 60 ? `${Math.floor(s.duration / 60)}h${s.duration % 60 ? s.duration % 60 : ''}` : `${s.duration} min`}`}
                </p>
              </div>
              <span className="font-data text-lg text-gold shrink-0">
                {s.price_negotiable ? 'A combinar' : formatCurrency(s.price)}
              </span>
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

/* ── Shared visual for a single cuidado — identical card whether it's
   offered as an add-on checkbox (ComplementsStep) or as the exclusive
   choice for a standalone booking (CarePicker), so the same 5 cuidados
   look and read the same in both places. ── */
function CuidadoCard({
  name,
  description,
  price,
  selected,
  onClick,
  role,
}: {
  name: string
  description: string
  price: number | null
  selected: boolean
  onClick: () => void
  role: 'checkbox' | 'button'
}) {
  return (
    <div
      role={role}
      aria-checked={role === 'checkbox' ? selected : undefined}
      aria-pressed={role === 'button' ? selected : undefined}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className={cn(
        'border px-[16px] py-[14px] cursor-pointer',
        'flex items-center justify-between gap-4 transition-all duration-200',
        selected ? 'border-gold bg-gold/10' : 'border-offwhite/[0.14] hover:border-offwhite/30',
      )}
    >
      <div>
        <p className="font-body font-normal text-sm text-offwhite">{name}</p>
        <p className="font-body font-light text-2xs text-offwhite/55 mt-[2px]">{description}</p>
      </div>
      <span className="font-data text-sm text-gold shrink-0 whitespace-nowrap">
        {price === null ? 'A combinar' : formatCurrency(price)}
      </span>
    </div>
  )
}

/* ── Complements — a real step in the flow, not a popup ── */
function ComplementsStep({
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
      {complements.length === 0 ? (
        <p className="font-body font-light text-[12px] text-offwhite/55 italic mb-[22px]">
          Nenhum complemento disponível para este serviço.
        </p>
      ) : (
        <div className="flex flex-col gap-[10px] mb-[22px]">
          {complements.map(c => (
            <CuidadoCard
              key={c.id}
              name={c.name}
              description={c.description}
              price={c.price}
              selected={selected.includes(c.id)}
              onClick={() => onToggle(c.id)}
              role="checkbox"
            />
          ))}
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light"
      >
        {selected.length > 0 ? 'Continuar' : 'Continuar sem complementos'}
      </button>
    </div>
  )
}

/* ── Cuidado picker — the exclusive choice for a standalone booking,
   same CuidadoCard as the add-on step, single-select instead of multi ── */
function CarePicker({
  items,
  highlighted,
  onHighlight,
  onContinue,
}: {
  items: Service[]
  highlighted: Service | null
  onHighlight: (item: Service) => void
  onContinue: () => void
}) {
  if (items.length === 0) {
    return <ServiceListSkeleton count={5} />
  }

  return (
    <div>
      <div className="flex flex-col gap-[10px] mb-[22px]">
        {items.map(s => (
          <CuidadoCard
            key={s.id}
            name={s.name}
            description={s.description}
            price={s.price_negotiable ? null : s.price}
            selected={highlighted?.id === s.id}
            onClick={() => onHighlight(s)}
            role="button"
          />
        ))}
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

/* ── A quiet pivot to the standalone-cuidado picker, offered inline —
   part of the same process, no route change, no modal ── */
function CareLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-[18px] block font-body font-light text-[10.5px] tracking-[0.1em] text-offwhite/55 hover:text-gold transition-colors duration-200 underline underline-offset-4 decoration-offwhite/15"
    >
      Quer reservar só um cuidado avulso? →
    </button>
  )
}

/* ── Running summary — keeps the chosen service, complements and total
   visible from the moment a service is committed through checkout, instead
   of only revealing the price on the final "Confirme seu horário" step. ── */
function RunningSummary({
  service,
  complements,
  selectedComplementIds,
}: {
  service: Service
  complements: Complement[]
  selectedComplementIds: string[]
}) {
  const chosen = complements.filter(c => selectedComplementIds.includes(c.id))
  const complementsPrice = chosen.reduce((sum, c) => sum + (c.price ?? 0), 0)
  const total = service.price_negotiable ? null : service.price + complementsPrice

  return (
    <div className="flex items-center justify-between gap-4 border border-offwhite/10 bg-offwhite/[0.03] px-[16px] py-[12px] mb-[22px]">
      <div className="min-w-0">
        <p className="font-body font-normal text-[12px] text-offwhite truncate">
          {service.name}
          {chosen.length > 0 && (
            <span className="text-offwhite/55"> + {chosen.length} {chosen.length === 1 ? 'complemento' : 'complementos'}</span>
          )}
        </p>
        <p className="font-body font-light text-2xs tracking-[0.12em] uppercase text-offwhite/55 mt-[2px]">
          {service.is_whatsapp_only ? 'Combinado via WhatsApp' : `${service.duration} min`}
        </p>
      </div>
      <span className="font-data text-[15px] text-gold shrink-0 whitespace-nowrap">
        {total === null ? 'A combinar' : formatCurrency(total)}
      </span>
    </div>
  )
}

/* ── Desktop/tablet sidebar (lg+ only) — the mobile column stays exactly
   as it was (RunningSummary inline in the flow); wide screens get a
   persistent side panel instead of a narrow phone-width flow floating in
   empty space, with Alison's own portrait reinforcing that this is a
   single-barber studio, not a generic scheduling system. ── */
function BookingSidebar({
  service,
  complements,
  selectedComplementIds,
}: {
  service: Service | null
  complements: Complement[]
  selectedComplementIds: string[]
}) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:gap-[20px] lg:sticky lg:top-[150px] lg:border lg:border-offwhite/10 lg:p-[26px]">
      <div className="relative w-[64px] h-[64px] rounded-full overflow-hidden shrink-0">
        <Image src="/images/alison4.png" alt="Alison Estevam" fill sizes="64px" className="object-cover object-top" />
      </div>
      <div>
        <p className="font-body font-light text-[9px] tracking-[0.3em] uppercase text-offwhite/55 mb-[4px]">
          Alison Estevam Studio
        </p>
        <p className="font-display font-light text-lg text-offwhite leading-[1.2]">
          Atendimento pessoal, sem sistema genérico de agenda.
        </p>
      </div>

      <div className="border-t border-offwhite/10 pt-[18px]">
        {service ? (
          <RunningSummary service={service} complements={complements} selectedComplementIds={selectedComplementIds} />
        ) : (
          <p className="font-body font-light text-[12px] text-offwhite/55 italic">
            Escolha um serviço para ver o resumo aqui.
          </p>
        )}
      </div>
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
  return (
    <SlotGrid
      date={date}
      slots={slots}
      selected={selected}
      onSelect={onSelect}
      emptyMessage="Nenhum horário disponível para esta data com este serviço."
      emptySlot={<WaitlistForm date={date} serviceId={serviceId} />}
    />
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
      <p className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/55 mb-3">
        Entrar na fila de espera
      </p>
      <div className="flex flex-col gap-[10px]">
        <input
          type="text"
          autoComplete="name"
          placeholder="Nome e sobrenome"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-lg px-[13px] py-[10px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none placeholder:text-offwhite/55"
        />
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          maxLength={15}
          value={whatsapp}
          onChange={e => setWhatsapp(maskPhoneInput(e.target.value))}
          className="w-full bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-lg px-[13px] py-[10px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none placeholder:text-offwhite/55"
        />
        {error && <p role="alert" className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65">{error}</p>}
        <Button onClick={handleSubmit} loading={loading} loadingText="Enviando" className="w-full">
          Entrar na fila
        </Button>
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
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/55 placeholder:font-body placeholder:font-light',
            errors.name ? 'border-error/55 focus:border-error focus:bg-error/5' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5'
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
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/55 placeholder:font-body placeholder:font-light',
            errors.whatsapp ? 'border-error/55 focus:border-error focus:bg-error/5' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5'
          )}
        />
        {errors.whatsapp && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.whatsapp}</p>}
      </div>

      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]" htmlFor="f-email">
          E-mail <span className="text-offwhite/55">(opcional)</span>
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
            'w-full bg-charcoal-mid border text-offwhite font-body font-light text-lg px-[15px] py-[12px]',
            'outline-none transition-all duration-250 rounded-none',
            'placeholder:text-offwhite/55 placeholder:font-body placeholder:font-light',
            errors.email ? 'border-error/55 focus:border-error focus:bg-error/5' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5'
          )}
        />
        {errors.email && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mt-1">{errors.email}</p>}
      </div>

      <Button onClick={handleContinue} size="lg" className="w-full mt-[10px]">
        Continuar
      </Button>
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
      <DetailCard
        rows={[
          { label: 'Serviço', value: service.name },
          { label: 'Complementos', value: chosen.length > 0 ? chosen.map(c => c.name).join(', ') : 'Nenhum' },
          { label: 'Data', value: dateLabel },
          { label: 'Horário', value: `${selectedSlot.startTime} – ${addMinutesToTime(selectedSlot.startTime, service.duration)}` },
          ...(appliedCoupon ? [{
            label: (
              <span className="text-sage-light">
                Cupom {appliedCoupon.code}
                <button
                  onClick={() => { setAppliedCoupon(null); setCouponInput(''); setCouponError(null) }}
                  className="ml-2 text-offwhite/55 hover:text-offwhite/60 underline underline-offset-2 text-[10px]"
                >
                  remover
                </button>
              </span>
            ),
            value: <span className="text-sage-light">−{formatCurrency(appliedCoupon.discountAmount)}</span>,
          }] : []),
        ]}
        footer={
          <div className="flex justify-between">
            <span className="font-body font-normal text-[12px] text-gold uppercase tracking-[0.1em]">Valor</span>
            <span className="font-data text-lg text-gold">{formatCurrency(totalPrice)}</span>
          </div>
        }
      />

      {!appliedCoupon && (
        <div className="mb-[16px]">
          <div className="flex gap-[8px]">
            <input
              type="text"
              value={couponInput}
              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
              placeholder="Cupom de desconto (opcional)"
              className="flex-1 bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-lg px-[15px] py-[12px] outline-none rounded-none placeholder:text-offwhite/55 focus:border-gold focus:bg-gold/5 transition-all duration-250"
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

      <Button onClick={handleSubmit} loading={loading} loadingText="Confirmando" size="lg" className="w-full">
        Confirmar agendamento
      </Button>
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
    <div className="animate-fade-up min-h-[calc(100vh-65px)] pt-[65px] flex flex-col items-center justify-center text-center px-8">
      <div className="relative w-[72px] h-[72px] mb-[26px]">
        <div className="relative w-full h-full rounded-full overflow-hidden border-[1.5px] border-gold">
          <Image src="/images/alison4.png" alt="Alison Estevam" fill sizes="72px" priority className="object-cover object-top" />
        </div>
        <div className="absolute -bottom-[3px] -right-[3px] w-[24px] h-[24px] rounded-full border-[1.5px] border-gold bg-charcoal flex items-center justify-center text-gold text-[11px]">
          ✓
        </div>
      </div>
      <h1 className="font-display font-light text-3xl text-offwhite leading-[1.2] mb-[12px]">
        Agendamento confirmado
      </h1>
      <p className="font-body font-light text-[13px] text-offwhite/55 mb-[30px] leading-[1.7] max-w-[300px]">
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
        className="mt-[14px] font-body font-light text-[9px] tracking-[0.25em] uppercase text-offwhite/55 hover:text-offwhite/70 transition-colors underline underline-offset-4 decoration-offwhite/15"
      >
        Adicionar ao calendário
      </a>

      <Link
        href="/conta"
        className="block mt-[16px] mx-auto bg-transparent border-none text-center font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/55 py-[6px] cursor-pointer hover:text-offwhite/85 transition-colors underline underline-offset-4 decoration-offwhite/10"
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

  const presetScreen = searchParams.get('tela') // 'cuidados' — arrives directly on the standalone-cuidado picker

  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [availability,  setAvailability]  = useState<AvailabilityMap>({})
  const [loadingAvail,  setLoadingAvail]  = useState(false)
  const [services,      setServices]      = useState<Service[]>([])
  const [careServices,  setCareServices]  = useState<Service[]>([])
  const [complements,   setComplements]   = useState<Complement[]>([])
  const [state,         setState]         = useState<BookingState>(() => ({
    step: presetScreen === 'cuidados' ? 'care' : 'service',
    selectedService: null, selectedComplementIds: [], selectedDate: null, selectedSlot: null, client: initialClient, result: null,
  }))

  // Fetch services once on mount
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServices(d.services ?? []))
      .catch(console.error)
  }, [])

  // Fetch the standalone-cuidado catalog only once we actually reach that step
  useEffect(() => {
    if (state.step !== 'care' || careServices.length > 0) return
    fetch('/api/services?scope=cuidados')
      .then(r => r.json())
      .then(d => setCareServices(d.services ?? []))
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step])

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

  const handleExclusive = (serviceName: string) => {
    window.open(buildExclusiveRequestUrl(serviceName), '_blank', 'noopener,noreferrer')
  }

  // Highlight only — the service isn't "committed" until Continue is clicked
  const highlightService = (service: Service) => {
    setState(s => ({ ...s, selectedService: service }))
  }

  // Commit the highlighted service: whatsapp-only (Horário Exclusivo,
  // Acabamento de Cabelo — anything with no fixed slot/price) goes straight
  // to WhatsApp, everything else fetches its complements.
  const commitService = useCallback((service: Service) => {
    if (service.is_whatsapp_only) { handleExclusive(service.name); return }
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
  // specific service card) — never runs for a Cuidados deep link
  // (presetScreen === 'cuidados'), since that one lands on 'care' and is
  // only ever pre-highlighted, not auto-committed (see below) — the user
  // still sees and confirms the dedicated cuidado screen themselves.
  useEffect(() => {
    if (!presetServiceSlug || presetScreen === 'cuidados' || state.step !== 'service') return
    fetch(`/api/services?slug=${encodeURIComponent(presetServiceSlug)}`)
      .then(r => r.json())
      .then(d => { if (d.service) commitService(d.service) })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetServiceSlug, presetScreen, state.step])

  // Pre-highlight (never auto-commit) the cuidado the user clicked "Agendar"
  // on, so the dedicated "Escolha o cuidado" screen shows it already
  // selected — a real screen they confirm, not an instant skip past it.
  useEffect(() => {
    if (state.step !== 'care' || careServices.length === 0 || !presetServiceSlug) return
    const match = careServices.find(s => s.slug === presetServiceSlug)
    if (match) highlightService(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, careServices, presetServiceSlug])

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

  // Earliest open slot within the currently-loaded month — lets a client
  // with no date preference skip straight past the calendar in one click,
  // instead of hunting month-by-month for an open day.
  const findNextAvailable = (): { date: Date; slot: Slot } | null => {
    const startOfToday = startOfDay(new Date())
    const candidates = Object.entries(availability)
      .filter(([, info]) => info.available && info.slots.some(s => s.available))
      .map(([dateStr, info]) => ({ date: new Date(`${dateStr}T00:00:00`), info }))
      .filter(c => c.date >= startOfToday)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    if (candidates.length === 0) return null
    const slot = [...candidates[0].info.slots].filter(s => s.available).sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
    return { date: candidates[0].date, slot }
  }
  const isCareSelected = !!state.selectedService && careServices.some(c => c.id === state.selectedService!.id)

  const backTo = (step: Step) => setState(s => ({ ...s, step }))

  const goToCare = () => setState(s => ({ ...s, step: 'care', selectedService: null, selectedComplementIds: [] }))

  const headerFor: Record<Exclude<Step, 'success'>, { eyebrow: string; title: string; subtitle: string }> = {
    service: {
      eyebrow: 'Agendamento',
      title: 'Escolha o serviço',
      subtitle: 'Selecione o que você deseja agendar hoje.',
    },
    complements: {
      eyebrow: 'Agendamento',
      title: 'Complementos',
      subtitle: state.selectedService
        ? `Adicione um cuidado extra ao ${state.selectedService.name}, se quiser — não é obrigatório.`
        : 'Adicione um cuidado extra, se quiser — não é obrigatório.',
    },
    care: {
      eyebrow: 'Agendamento',
      title: 'Escolha o cuidado',
      subtitle: 'Reserve um cuidado avulso, sem precisar de corte ou barba junto.',
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
    <div className="px-8 lg:px-[60px] pt-[65px] pb-16 lg:grid lg:grid-cols-[260px_1fr] lg:gap-[48px] lg:items-start">
      <BookingSidebar
        service={state.selectedService}
        complements={complements}
        selectedComplementIds={state.selectedComplementIds}
      />

      <div>
      {state.step === 'service'     && <BackLink href="/">← Voltar ao início</BackLink>}
      {state.step === 'complements' && <BackLink onClick={() => backTo('service')}>← Trocar serviço</BackLink>}
      {state.step === 'care'        && <BackLink onClick={() => backTo('service')}>← Ver serviços</BackLink>}
      {state.step === 'schedule'    && (
        <BackLink onClick={() => backTo(isCareSelected ? 'care' : 'service')}>← Trocar serviço</BackLink>
      )}
      {state.step === 'details'     && <BackLink onClick={() => backTo('schedule')}>← Ajustar data/horário</BackLink>}
      {state.step === 'summary'     && <BackLink onClick={() => backTo('details')}>← Ajustar seus dados</BackLink>}

      <StepHeader {...headerFor[state.step as Exclude<Step, 'success'>]} />
      <StepDots current={state.step} isCareSelected={isCareSelected} onNavigate={backTo} />

      {state.selectedService && (state.step === 'complements' || state.step === 'schedule' || state.step === 'details') && (
        <div className="mt-[18px] lg:hidden">
          <RunningSummary
            service={state.selectedService}
            complements={complements}
            selectedComplementIds={state.selectedComplementIds}
          />
        </div>
      )}

      <div className="mt-[26px] relative">
        {state.step === 'service' && (
          <>
            <ServicePicker
              services={services}
              highlighted={state.selectedService}
              onHighlight={highlightService}
              onContinue={() => state.selectedService && commitService(state.selectedService)}
            />
            <CareLink onClick={goToCare} />
          </>
        )}

        {state.step === 'care' && (
          <CarePicker
            items={careServices}
            highlighted={state.selectedService}
            onHighlight={highlightService}
            onContinue={() => state.selectedService && commitService(state.selectedService)}
          />
        )}

        {state.step === 'complements' && (
          <>
            <ComplementsStep
              complements={complements}
              selected={state.selectedComplementIds}
              onToggle={toggleComplement}
              onContinue={confirmComplements}
            />
            <CareLink onClick={goToCare} />
          </>
        )}

        {state.step === 'schedule' && state.selectedService && (
          <div>
            {!state.selectedDate && (() => {
              const next = findNextAvailable()
              if (!next) return null
              return (
                <button
                  onClick={() => { selectDay(next.date); selectSlot(next.slot) }}
                  className="mb-[16px] inline-flex items-center gap-2 font-body font-light text-[10.5px] tracking-[0.12em] uppercase text-gold/80 hover:text-gold border border-gold/25 hover:border-gold/50 px-[14px] py-[9px] transition-all duration-200"
                >
                  Horário mais próximo: {format(next.date, "d 'de' MMM", { locale: ptBR })} às {next.slot.startTime} →
                </button>
              )
            })()}
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
    </div>
    </>
  )
}
