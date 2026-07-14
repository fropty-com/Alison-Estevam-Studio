'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function ConfirmForm({ code }: { code: string }) {
  const [pending, startTransition] = useTransition()
  const [done,    setDone]          = useState(false)
  const [error,   setError]         = useState<string | null>(null)

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/appointments/${code}/confirm`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Erro ao confirmar presença.')
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="bg-offwhite/5 border border-offwhite/14 p-8 text-center">
        <p className="font-display font-light text-[22px] text-offwhite/60 italic mb-2">
          Presença confirmada.
        </p>
        <p className="font-body font-light text-[10px] text-offwhite/30 tracking-[0.15em]">
          Te esperamos no horário combinado.
        </p>
        <Link
          href="/conta"
          className="block mt-[16px] mx-auto bg-transparent border-none text-center font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/30 py-[6px] cursor-pointer hover:text-offwhite/55 transition-colors underline underline-offset-4 decoration-offwhite/10"
        >
          Voltar ao início
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70">{error}</p>
      )}
      <button
        onClick={handleConfirm}
        disabled={pending}
        className={cn(
          'w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
          'bg-gold text-charcoal-deep transition-all duration-300',
          'hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        {pending ? 'Confirmando…' : 'Confirmar presença'}
      </button>
    </div>
  )
}
