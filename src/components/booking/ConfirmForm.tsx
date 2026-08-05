'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { ResultCard } from '@/components/booking/BookingChrome'

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
      <ResultCard title="Presença confirmada.">
        <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.15em]">
          Te esperamos no horário combinado.
        </p>
      </ResultCard>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70">{error}</p>
      )}
      <Button onClick={handleConfirm} loading={pending} loadingText="Confirmando" size="lg" className="w-full">
        Confirmar presença
      </Button>
    </div>
  )
}
