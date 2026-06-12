'use client'

import { useState, useTransition } from 'react'
import { updateClientNotes, toggleClientVip } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function ClientActions({ id, vip, notes }: { id: string; vip: boolean; notes: string }) {
  const [pending, startTransition] = useTransition()
  const [noteText, setNoteText]  = useState(notes)
  const [feedback, setFeedback]  = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else setFeedback(null)
    })
  }

  return (
    <div className="space-y-3">
      {/* VIP toggle */}
      <button
        disabled={pending}
        onClick={() => act(() => toggleClientVip(id, !vip))}
        className={cn(
          'w-full py-[10px] font-body font-light text-[8.5px] tracking-[0.28em] uppercase',
          'border transition-all duration-200 disabled:opacity-40',
          vip
            ? 'border-gold/30 bg-gold/8 text-gold/70 hover:bg-gold/15'
            : 'border-offwhite/10 text-offwhite/30 hover:border-gold/25 hover:text-gold/60'
        )}
      >
        {vip ? '★ Cliente VIP' : '☆ Marcar como VIP'}
      </button>

      {/* Notes */}
      <div>
        <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/25 mb-[6px]">Notas internas</p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          rows={3}
          placeholder="Preferências, observações, histórico relevante…"
          className={cn(
            'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite/70',
            'font-body font-light text-[11px] px-3 py-2 outline-none rounded-none resize-none',
            'focus:border-sage/50 transition-colors placeholder:text-offwhite/18'
          )}
        />
        <button
          disabled={pending}
          onClick={() => act(() => updateClientNotes(id, noteText))}
          className="mt-2 px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-sage/10 border border-sage/22 text-sage-light hover:bg-sage/20 transition-all duration-200 disabled:opacity-40"
        >
          {pending ? 'Salvando…' : 'Salvar notas'}
        </button>
      </div>

      {feedback && (
        <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70">{feedback}</p>
      )}
    </div>
  )
}
