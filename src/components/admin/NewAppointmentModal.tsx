'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, maskPhoneInput, isFullName, isValidWhatsApp, formatCurrency } from '@/lib/utils'
import { createManualAppointment } from '@/app/admin/actions'
import { MiniCalendar, SlotGrid, type CalendarSlot, type AvailabilityMap } from '@/components/booking/MiniCalendar'
import { startOfMonth, format } from 'date-fns'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { ClientAvatar } from './ClientsTable'

interface Service { id: string; name: string; price: number; duration: number; is_whatsapp_only: boolean }
interface Complement { id: string; name: string; description: string; price: number | null }
interface ClientHit { id: string; name: string; whatsapp: string; email: string | null; avatar_url: string | null }

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/[0.18]'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/[0.28] mb-[5px]'

export function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Service + complements
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [complements, setComplements] = useState<Complement[]>([])
  const [selectedComplementIds, setSelectedComplementIds] = useState<string[]>([])

  // Date/time
  const [viewing, setViewing] = useState(() => startOfMonth(new Date()))
  const [availability, setAvailability] = useState<AvailabilityMap>({})
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null)

  // Client
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<ClientHit[]>([])
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedService) { setComplements([]); return }
    fetch(`/api/complements?serviceId=${selectedService.id}`)
      .then(r => r.json())
      .then(d => setComplements(d.complements ?? []))
      .catch(() => setComplements([]))
    setSelectedComplementIds([])
    setSelectedDate(null)
    setSelectedSlot(null)
  }, [selectedService])

  useEffect(() => {
    if (!selectedService) return
    setLoadingAvail(true)
    const y = viewing.getFullYear()
    const m = viewing.getMonth() + 1
    fetch(`/api/availability?year=${y}&month=${m}&duration=${selectedService.duration}`)
      .then(r => r.json())
      .then(d => setAvailability(d.availability ?? {}))
      .catch(() => {})
      .finally(() => setLoadingAvail(false))
  }, [viewing, selectedService])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setHits([]); return }
    const timer = setTimeout(() => {
      fetch(`/api/admin/clients/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => setHits(d.clients ?? []))
        .catch(() => setHits([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const changeMonth = (dir: 1 | -1) => {
    const next = new Date(viewing)
    next.setMonth(next.getMonth() + dir)
    setViewing(startOfMonth(next))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const pickClient = (c: ClientHit) => {
    setName(c.name)
    // c.whatsapp comes from the DB in E.164 (+5511987654321) — maskPhoneInput
    // expects a bare local number, so the +55 must be stripped first or it
    // gets masked in as if it were the area code, corrupting the number.
    setWhatsapp(maskPhoneInput(c.whatsapp.replace(/^\+?55/, '')))
    setEmail(c.email ?? '')
    setQuery('')
    setHits([])
  }

  const totalPrice = (selectedService?.price ?? 0) +
    complements.filter(c => selectedComplementIds.includes(c.id)).reduce((sum, c) => sum + Number(c.price ?? 0), 0)

  const canSubmit = !!selectedService && !!selectedSlot && isFullName(name) && isValidWhatsApp(whatsapp)

  const handleSubmit = () => {
    if (!canSubmit || !selectedService || !selectedSlot) return
    setError(null)
    startTransition(async () => {
      const res = await createManualAppointment({
        name,
        whatsapp,
        email: email || undefined,
        serviceId: selectedService.id,
        slotId: selectedSlot.id,
        complementIds: selectedComplementIds,
        notes: notes || undefined,
      })
      if (res?.error) setError(res.error)
      else { router.refresh(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-charcoal-deep/60 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-[560px] my-8 bg-charcoal border border-offwhite/[0.14] p-6">
        <button
          onClick={onClose}
          aria-label={t.agenda.close}
          className="absolute top-5 right-5 w-[36px] h-[36px] border border-offwhite/[0.18] text-offwhite/45 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
        >
          ✕
        </button>

        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">{t.agenda.newAppointment.eyebrow}</p>
        <h2 className="font-display font-light text-[22px] text-offwhite tracking-[0.02em] mb-5">{t.agenda.newAppointment.title}</h2>

        {/* Service */}
        <div className="mb-5">
          <label className={labelCls}>{t.agenda.newAppointment.service}</label>
          <div className="flex flex-col gap-[6px]">
            {services.map(s => {
              const isSel = selectedService?.id === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedService(s)}
                  className={cn(
                    'flex items-center justify-between gap-4 px-3 py-[9px] border text-left transition-all duration-150',
                    isSel ? 'border-gold bg-gold/10' : 'border-offwhite/10 hover:border-offwhite/25',
                  )}
                >
                  <span className="font-body font-light text-[12px] text-offwhite">{s.name}{s.is_whatsapp_only ? t.agenda.newAppointment.exclusive : ''}</span>
                  <span className="font-data text-[12px] text-gold shrink-0">{formatCurrency(s.price)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Complements */}
        {selectedService && complements.length > 0 && (
          <div className="mb-5">
            <label className={labelCls}>{t.agenda.newAppointment.complements}</label>
            <div className="flex flex-col gap-[6px]">
              {complements.map(c => {
                const isSel = selectedComplementIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedComplementIds(ids => isSel ? ids.filter(id => id !== c.id) : [...ids, c.id])}
                    className={cn(
                      'flex items-center justify-between gap-4 px-3 py-[8px] border text-left transition-all duration-150',
                      isSel ? 'border-gold bg-gold/10' : 'border-offwhite/10 hover:border-offwhite/25',
                    )}
                  >
                    <span className="font-body font-light text-[11px] text-offwhite/80">{c.name}</span>
                    <span className="font-data text-[11px] text-gold shrink-0">{c.price ? formatCurrency(c.price) : '—'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Date/time */}
        {selectedService && (
          <div className="mb-5">
            <label className={labelCls}>{t.agenda.newAppointment.dateTime}</label>
            <MiniCalendar
              current={viewing}
              selected={selectedDate}
              availability={availability}
              loading={loadingAvail}
              onSelectDay={d => { setSelectedDate(d); setSelectedSlot(null) }}
              onChangeMonth={changeMonth}
            />
            {selectedDate && (
              <SlotGrid
                date={selectedDate}
                slots={availability[format(selectedDate, 'yyyy-MM-dd')]?.slots ?? []}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}
          </div>
        )}

        {/* Client */}
        {selectedSlot && (
          <>
            <div className="mb-5">
              <label className={labelCls}>{t.agenda.newAppointment.searchExisting}</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.agenda.newAppointment.searchPlaceholder}
                className={inputCls}
              />
              {hits.length > 0 && (
                <div className="mt-[6px] border border-offwhite/10 divide-y divide-offwhite/8">
                  {hits.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickClient(c)}
                      className="w-full flex items-center gap-3 px-3 py-[8px] text-left hover:bg-offwhite/5 transition-colors"
                    >
                      <ClientAvatar name={c.name} avatarUrl={c.avatar_url} size={22} />
                      <span className="flex-1 min-w-0 font-body font-light text-[11px] text-offwhite/80 truncate">{c.name}</span>
                      <span className="shrink-0 font-data text-[10px] text-offwhite/35">{c.whatsapp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="col-span-2">
                <label className={labelCls}>{t.agenda.newAppointment.fullName}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.agenda.newAppointment.fullNamePlaceholder} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t.agenda.newAppointment.whatsapp}</label>
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(maskPhoneInput(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t.agenda.newAppointment.emailOptional}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>{t.agenda.newAppointment.internalNote}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t.agenda.newAppointment.internalNotePlaceholder} className={cn(inputCls, 'resize-none')} />
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70 mb-3">{error}</p>
        )}

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-offwhite/[0.08]">
          <p className="font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/35">
            {t.agenda.newAppointment.total} <span className="font-data text-gold ml-1">{formatCurrency(totalPrice)}</span>
          </p>
          <button
            type="button"
            disabled={!canSubmit || pending}
            onClick={handleSubmit}
            className={cn(
              'px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase',
              'bg-gold text-charcoal-deep transition-all duration-300',
              'hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            {pending ? t.agenda.newAppointment.saving : t.agenda.newAppointment.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
