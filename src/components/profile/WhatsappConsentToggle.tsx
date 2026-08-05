'use client'

import { useState, useTransition } from 'react'
import { updateWhatsappConsent } from '@/app/perfil/actions'
import { cn } from '@/lib/utils'

export function WhatsappConsentToggle({ initialConsent }: { initialConsent: boolean }) {
  const [consent, setConsent] = useState(initialConsent)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggle = () => {
    const next = !consent
    setConsent(next)
    setError(null)
    startTransition(async () => {
      const res = await updateWhatsappConsent(next)
      if (res?.error) {
        setConsent(!next)
        setError(res.error)
      }
    })
  }

  return (
    <div className="mb-[26px]">
      <button
        type="button"
        role="switch"
        aria-checked={consent}
        disabled={pending}
        onClick={toggle}
        className="w-full flex items-center justify-between border border-offwhite/[0.08] px-5 py-4 hover:border-offwhite/[0.16] transition-colors duration-200 disabled:opacity-60"
      >
        <div className="text-left">
          <p className="font-body font-light text-[12px] text-offwhite/65">Avisos por WhatsApp</p>
          <p className="font-body font-light text-[9.5px] text-offwhite/55 mt-[2px]">
            {consent ? 'Ativado' : 'Desativado'}
          </p>
        </div>
        <span
          className={cn(
            'relative w-[34px] h-[20px] shrink-0 rounded-full transition-colors duration-200',
            consent ? 'bg-sage/40' : 'bg-offwhite/15'
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full transition-all duration-200',
              consent ? 'left-[17px] bg-sage-light' : 'left-[3px] bg-offwhite/60'
            )}
          />
        </span>
      </button>
      {error && (
        <p className="font-body font-light text-[9.5px] text-error/70 mt-[6px]">{error}</p>
      )}
    </div>
  )
}
