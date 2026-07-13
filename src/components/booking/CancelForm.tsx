'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

export function CancelForm({ code }: { code: string }) {
  const [pending,  startTransition] = useTransition()
  const [reason,   setReason]       = useState('')
  const [done,     setDone]         = useState(false)
  const [error,    setError]        = useState<string | null>(null)
  const [confirm,  setConfirm]      = useState(false)

  const handleCancel = () => {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/appointments/${code}/cancel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reason: reason.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Erro ao cancelar.')
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="bg-offwhite/5 border border-offwhite/10 p-8 text-center">
        <p className="font-display font-light text-[22px] text-offwhite/60 italic mb-2">
          Agendamento cancelado.
        </p>
        <p className="font-body font-light text-[10px] text-offwhite/30 tracking-[0.15em]">
          O horário foi liberado. Esperamos vê-lo em breve.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className={cn(
            'w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
            'border border-error/50 bg-error/10 text-error/90 transition-all duration-300',
            'hover:bg-error/20 hover:border-error/70 hover:text-error',
          )}
        >
          Cancelar agendamento
        </button>
      ) : (
        <>
          <div>
            <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[6px]">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Ex: Imprevisto, viagem…"
              className="w-full bg-offwhite/5 border border-offwhite/10 text-offwhite font-body font-light text-[12px] px-3 py-[10px] outline-none resize-none focus:border-offwhite/25 transition-colors placeholder:text-offwhite/18"
            />
          </div>

          {error && (
            <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={pending}
              className={cn(
                'flex-1 py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase',
                'border border-error/50 bg-error/10 text-error/90 transition-all duration-300',
                'hover:bg-error/20 hover:border-error/70 hover:text-error',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {pending ? 'Cancelando…' : 'Confirmar cancelamento'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              disabled={pending}
              className="px-6 py-[16px] font-body font-light text-[9px] tracking-[0.28em] uppercase border border-offwhite/10 text-offwhite/30 hover:text-offwhite/55 transition-colors disabled:opacity-40"
            >
              Voltar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
