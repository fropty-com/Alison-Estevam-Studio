'use client'

import { useState, useTransition } from 'react'
import { addBlockedPeriod } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function BlockedPeriodForm() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addBlockedPeriod(fd)
      if (res?.error) setFeedback(res.error)
      else { setSuccess(true); (e.target as HTMLFormElement).reset() }
    })
  }

  return (
    <div className="bg-offwhite/3 border border-offwhite/7 p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-4">
        Bloquear período
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]">
            Data início
          </label>
          <input
            type="date"
            name="date_start"
            required
            min={today}
            className="w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors"
          />
        </div>
        <div>
          <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]">
            Data fim
          </label>
          <input
            type="date"
            name="date_end"
            required
            min={today}
            className="w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors"
          />
        </div>
        <div>
          <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]">
            Motivo (opcional)
          </label>
          <input
            type="text"
            name="reason"
            placeholder="Ex: Férias"
            className="w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors placeholder:text-offwhite/18"
          />
        </div>
        <div className="sm:col-span-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              'px-6 py-[10px] font-body font-light text-[9px] tracking-[0.35em] uppercase',
              'bg-offwhite/8 border border-offwhite/14 text-offwhite/60',
              'hover:bg-sage/12 hover:border-sage/30 hover:text-sage-light',
              'transition-all duration-200 disabled:opacity-40'
            )}
          >
            {pending ? 'Bloqueando…' : 'Bloquear período'}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">Período bloqueado.</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}
