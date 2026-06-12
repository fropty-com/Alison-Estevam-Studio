'use client'

import { useState, useTransition } from 'react'
import { updateAppointmentStatus, addAppointmentNote } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function AppointmentActions({ id, status, notes }: { id: string; status: string; notes?: string | null }) {
  const [pending, startTransition] = useTransition()
  const [showNote,    setShowNote]    = useState(false)
  const [noteText,    setNoteText]    = useState(notes ?? '')
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else setFeedback(null)
    })
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {status === 'pending' && (
          <button
            disabled={pending}
            onClick={() => act(() => updateAppointmentStatus(id, 'confirmed'))}
            className={cn(
              'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
              'bg-sage/12 border border-sage/30 text-sage-light',
              'hover:bg-sage/22 transition-all duration-200 disabled:opacity-40'
            )}
          >
            Confirmar
          </button>
        )}

        {(status === 'pending' || status === 'confirmed') && (
          <>
            <button
              disabled={pending}
              onClick={() => act(() => updateAppointmentStatus(id, 'completed'))}
              className={cn(
                'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
                'bg-offwhite/5 border border-offwhite/12 text-offwhite/55',
                'hover:bg-offwhite/10 transition-all duration-200 disabled:opacity-40'
              )}
            >
              Concluir
            </button>

            <button
              disabled={pending}
              onClick={() => setCancelModal(true)}
              className={cn(
                'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
                'bg-error/5 border border-error/20 text-error/60',
                'hover:bg-error/10 transition-all duration-200 disabled:opacity-40'
              )}
            >
              Cancelar
            </button>
          </>
        )}

        <button
          onClick={() => setShowNote(v => !v)}
          className={cn(
            'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
            'border border-offwhite/10 text-offwhite/30',
            'hover:border-offwhite/25 hover:text-offwhite/55 transition-all duration-200'
          )}
        >
          {showNote ? 'Fechar nota' : 'Nota'}
        </button>
      </div>

      {/* Note editor */}
      {showNote && (
        <div className="space-y-2">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={2}
            placeholder="Anotações sobre este agendamento…"
            className={cn(
              'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite/80',
              'font-body font-light text-[11px] px-3 py-2 outline-none rounded-none resize-none',
              'focus:border-sage/50 transition-colors placeholder:text-offwhite/20'
            )}
          />
          <button
            disabled={pending}
            onClick={() => act(() => addAppointmentNote(id, noteText))}
            className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-sage/12 border border-sage/25 text-sage-light hover:bg-sage/22 transition-all duration-200 disabled:opacity-40"
          >
            {pending ? 'Salvando…' : 'Salvar nota'}
          </button>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="bg-error/5 border border-error/20 p-4 space-y-2">
          <p className="font-body font-light text-[9px] tracking-[0.22em] uppercase text-error/70">
            Motivo do cancelamento (opcional)
          </p>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Ex: solicitado pelo cliente"
            className="w-full bg-offwhite/3 border border-offwhite/9 text-offwhite/80 font-body font-light text-[11px] px-3 py-2 outline-none rounded-none focus:border-error/40 transition-colors placeholder:text-offwhite/20"
          />
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() => {
                setCancelModal(false)
                act(() => updateAppointmentStatus(id, 'cancelled', cancelReason || undefined))
              }}
              className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-error/12 border border-error/25 text-error/70 hover:bg-error/20 transition-all duration-200 disabled:opacity-40"
            >
              Confirmar cancelamento
            </button>
            <button
              onClick={() => setCancelModal(false)}
              className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.28em] uppercase border border-offwhite/10 text-offwhite/30 hover:text-offwhite/55 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70">{feedback}</p>
      )}
    </div>
  )
}
