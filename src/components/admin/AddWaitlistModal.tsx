'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, maskPhoneInput, isFullName, isValidWhatsApp } from '@/lib/utils'
import { createManualWaitlistEntry } from '@/app/admin/actions'
import { todayInSaoPaulo } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

interface Service { id: string; name: string; is_whatsapp_only: boolean }
interface ClientHit { id: string; name: string; whatsapp: string; email: string | null }

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/[0.18]'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/[0.28] mb-[5px]'

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9.8" y1="9.8" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function AddWaitlistModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<ClientHit[]>([])
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services ?? [])).catch(() => {})
  }, [])

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

  const pickClient = (c: ClientHit) => {
    setName(c.name)
    // c.whatsapp comes from the DB in E.164 (+5511987654321) — maskPhoneInput
    // expects a bare local number, so the +55 must be stripped first or it
    // gets masked in as if it were the area code, corrupting the number.
    setWhatsapp(maskPhoneInput(c.whatsapp.replace(/^\+?55/, '')))
    setQuery('')
    setHits([])
  }

  const canSubmit = isFullName(name) && isValidWhatsApp(whatsapp) && !!serviceId && !!preferredDate

  const handleSubmit = () => {
    if (!canSubmit) return
    setError(null)
    startTransition(async () => {
      const res = await createManualWaitlistEntry({ name, whatsapp, serviceId, preferredDate, note: note || undefined })
      if (res?.error) setError(res.error)
      else { router.refresh(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-charcoal-deep/60 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-[480px] my-8 bg-charcoal border border-offwhite/[0.14] p-6">
        <button
          onClick={onClose}
          aria-label={t.waitlist.modal.close}
          className="absolute top-5 right-5 w-[36px] h-[36px] border border-offwhite/[0.18] text-offwhite/45 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
        >
          ✕
        </button>

        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">{t.waitlist.modal.eyebrow}</p>
        <h2 className="font-display font-light text-[22px] text-offwhite tracking-[0.02em] mb-5">{t.waitlist.modal.title}</h2>

        {/* Client search */}
        <div className="mb-5">
          <label className={labelCls}>{t.waitlist.modal.searchExisting}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/30 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.waitlist.modal.searchPlaceholder}
              className={cn(inputCls, 'pl-9')}
            />
          </div>
          {hits.length > 0 && (
            <div className="mt-[6px] border border-offwhite/10 divide-y divide-offwhite/8">
              {hits.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickClient(c)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-[8px] text-left hover:bg-offwhite/5 transition-colors"
                >
                  <span className="font-body font-light text-[11px] text-offwhite/80">{c.name}</span>
                  <span className="font-data text-[10px] text-offwhite/35">{c.whatsapp}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="col-span-2">
            <label className={labelCls}>{t.waitlist.modal.fullName}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.waitlist.modal.fullNamePlaceholder} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>{t.waitlist.modal.whatsapp}</label>
            <input type="tel" value={whatsapp} onChange={e => setWhatsapp(maskPhoneInput(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>{t.waitlist.modal.desiredService}</label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className={cn(inputCls, 'appearance-none [color-scheme:dark]')}
            >
              <option value="" className="bg-charcoal">{t.waitlist.modal.selectPlaceholder}</option>
              {services.map(s => (
                <option key={s.id} value={s.id} className="bg-charcoal">
                  {s.name}{s.is_whatsapp_only ? t.waitlist.modal.exclusive : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={labelCls}>{t.waitlist.modal.preferredDate}</label>
            <input
              type="date"
              value={preferredDate}
              min={todayInSaoPaulo()}
              onChange={e => setPreferredDate(e.target.value)}
              className={cn(inputCls, '[color-scheme:dark]')}
            />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>{t.waitlist.modal.internalNote}</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder={t.waitlist.modal.internalNotePlaceholder} className={cn(inputCls, 'resize-none')} />
          </div>
        </div>

        {error && (
          <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70 mb-3">{error}</p>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-offwhite/[0.08]">
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
            {pending ? t.waitlist.modal.saving : t.waitlist.modal.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
