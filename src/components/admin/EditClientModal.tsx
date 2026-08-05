'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateClientProfile } from '@/app/admin/actions'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { useModalA11y } from '@/lib/hooks/useModalA11y'

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'

export function EditClientModal({
  id,
  name: initialName,
  whatsapp: initialWhatsapp,
  email: initialEmail,
  birthDate: initialBirthDate,
  onClose,
}: {
  id: string
  name: string
  whatsapp: string
  email: string | null
  birthDate?: string | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const panelRef = useModalA11y(onClose)

  const [name, setName] = useState(initialName)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)
  const [email, setEmail] = useState(initialEmail ?? '')
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? '')

  const canSubmit = name.trim().length > 0 && whatsapp.trim().length > 0

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateClientProfile(id, { name, whatsapp, email, birthDate })
      if (res.error) { setError(res.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-charcoal-deep/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={t.clients.edit.title} tabIndex={-1} className="relative w-full max-w-[380px] bg-charcoal border border-offwhite/[0.14] p-6 outline-none">
        <button
          onClick={onClose}
          aria-label={t.clients.detail.close}
          className="absolute top-5 right-5 w-[36px] h-[36px] border border-offwhite/[0.18] text-offwhite/55 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
        >
          ✕
        </button>

        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.clients.edit.eyebrow}</p>
        <h2 className="font-display font-light text-[20px] text-offwhite tracking-[0.02em] mb-5">{t.clients.edit.title}</h2>

        <div className="space-y-4 mb-5">
          <div>
            <label className={labelCls}>{t.clients.edit.name}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.clients.edit.namePlaceholder}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t.clients.edit.whatsapp}</label>
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder={t.clients.edit.whatsappPlaceholder}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t.clients.edit.emailOptional}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t.clients.edit.birthDateOptional}</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70 mb-3">{error}</p>
        )}

        <button
          type="button"
          disabled={!canSubmit || pending}
          onClick={submit}
          className="w-full px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {pending ? t.clients.edit.saving : t.clients.edit.submit}
        </button>
      </div>
    </div>
  )
}
