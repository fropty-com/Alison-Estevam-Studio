'use client'

import { useState, useTransition } from 'react'
import { updateAvailabilityRule } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function AvailabilityRuleRow({ rule, weekdayLabel }: {
  rule: { id: string; weekday: number; start_time: string; end_time: string; active: boolean }
  weekdayLabel: string
}) {
  const [pending, startTransition] = useTransition()
  const [editing, setEditing]  = useState(false)
  const [start,   setStart]    = useState(rule.start_time.substring(0, 5))
  const [end,     setEnd]      = useState(rule.end_time.substring(0, 5))
  const [feedback, setFeedback] = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else { setFeedback(null); setEditing(false) }
    })
  }

  return (
    <div className={cn('px-5 py-4 transition-opacity duration-200', !rule.active && 'opacity-45')}>
      <div className="flex items-center gap-4">
        {/* Active toggle */}
        <button
          disabled={pending}
          onClick={() => act(() => updateAvailabilityRule(rule.id, { active: !rule.active }))}
          className={cn(
            'w-[34px] h-[20px] rounded-full border transition-all duration-300 relative shrink-0 disabled:opacity-40',
            rule.active ? 'bg-sage/25 border-sage/40' : 'bg-offwhite/5 border-offwhite/15'
          )}
          aria-label={rule.active ? 'Desativar' : 'Ativar'}
        >
          <span className={cn(
            'absolute top-[3px] w-[12px] h-[12px] rounded-full transition-all duration-300',
            rule.active ? 'left-[18px] bg-sage' : 'left-[3px] bg-offwhite/25'
          )} />
        </button>

        <span className="font-body font-light text-[12px] text-offwhite/70 w-8 shrink-0">{weekdayLabel}</span>

        {!editing ? (
          <>
            <span className="font-data text-[14px] text-offwhite/60 flex-1">
              {start} → {end}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/25 hover:text-offwhite/55 transition-colors px-2 py-1 border border-transparent hover:border-offwhite/12"
            >
              Editar
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="bg-offwhite/5 border border-offwhite/12 text-offwhite font-data text-[13px] px-2 py-1 outline-none rounded-none focus:border-sage/50 transition-colors" />
            <span className="text-offwhite/25 font-body font-light text-[10px]">→</span>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="bg-offwhite/5 border border-offwhite/12 text-offwhite font-data text-[13px] px-2 py-1 outline-none rounded-none focus:border-sage/50 transition-colors" />
            <button
              disabled={pending}
              onClick={() => act(() => updateAvailabilityRule(rule.id, { start_time: start, end_time: end }))}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-sage/12 border border-sage/25 text-sage-light hover:bg-sage/22 transition-all disabled:opacity-40"
            >
              {pending ? '…' : 'Ok'}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/25 hover:text-offwhite/50 transition-colors">
              ✕
            </button>
          </div>
        )}
      </div>
      {feedback && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-2">{feedback}</p>}
    </div>
  )
}
