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
      <div className="bg-offwhite/3 border border-offwhite/7 p-8 text-center">
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
        <>
          <p className="font-body font-light text-[12px] text-offwhite/45 leading-relaxed">
            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
          </p>
          <button
            onClick={() => setConfirm(true)}
            className="w-full py-[13px] font-body font-light text-[9px] tracking-[0.35em] uppercase border border-error/30 text-error/60 hover:bg-error/5 hover:border-error/50 hover:text-error/80 transition-all duration-200"
          >
            Cancelar agendamento
          </button>
        </>
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
              className="w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[10px] outline-none resize-none focus:border-offwhite/22 transition-colors placeholder:text-offwhite/18"
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
                'flex-1 py-[13px] font-body font-light text-[9px] tracking-[0.35em] uppercase',
                'border border-error/30 text-error/60',
                'hover:bg-error/5 hover:border-error/50 hover:text-error/80',
                'transition-all duration-200 disabled:opacity-40'
              )}
            >
              {pending ? 'Cancelando…' : 'Confirmar cancelamento'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              disabled={pending}
              className="px-6 py-[13px] font-body font-light text-[9px] tracking-[0.28em] uppercase border border-offwhite/10 text-offwhite/30 hover:text-offwhite/55 transition-colors disabled:opacity-40"
            >
              Voltar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
