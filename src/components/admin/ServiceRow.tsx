'use client'

import { useState, useTransition } from 'react'
import { updateService } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function ServiceRow({ service }: { service: {
  id: string; name: string; description: string | null
  duration: number; price: number; active: boolean; position: number
}}) {
  const [pending,   startTransition] = useTransition()
  const [editing,   setEditing]  = useState(false)
  const [price,     setPrice]    = useState(String(service.price))
  const [duration,  setDuration] = useState(String(service.duration))
  const [feedback,  setFeedback] = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else { setFeedback(null); setEditing(false) }
    })
  }

  return (
    <div className={cn('px-5 py-4 transition-opacity duration-200', !service.active && 'opacity-45')}>
      <div className="flex items-center gap-4">
        {/* Active toggle */}
        <button
          disabled={pending}
          onClick={() => act(() => updateService(service.id, { active: !service.active }))}
          className={cn(
            'w-[34px] h-[20px] rounded-full border transition-all duration-300 relative shrink-0 disabled:opacity-40',
            service.active ? 'bg-sage/25 border-sage/40' : 'bg-offwhite/5 border-offwhite/15'
          )}
          aria-label={service.active ? 'Desativar' : 'Ativar'}
        >
          <span className={cn(
            'absolute top-[3px] w-[12px] h-[12px] rounded-full transition-all duration-300',
            service.active ? 'left-[18px] bg-sage' : 'left-[3px] bg-offwhite/25'
          )} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-body font-light text-[13px] text-offwhite">{service.name}</p>
          {service.description && (
            <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mt-[2px]">
              {service.description}
            </p>
          )}
        </div>

        {!editing ? (
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <p className="font-data text-[16px] text-offwhite/70">R$ {service.price}</p>
              <p className="font-body font-light text-[8.5px] text-offwhite/25 tracking-[0.12em]">{service.duration}min</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/25 hover:text-offwhite/55 transition-colors px-2 py-1 border border-transparent hover:border-offwhite/12"
            >
              Editar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-body font-light text-[8px] text-offwhite/30">R$</span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-16 bg-offwhite/5 border border-offwhite/12 text-offwhite font-data text-[13px] px-2 py-1 outline-none rounded-none focus:border-sage/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-14 bg-offwhite/5 border border-offwhite/12 text-offwhite font-body font-light text-[11px] px-2 py-1 outline-none rounded-none focus:border-sage/50 transition-colors"
              />
              <span className="font-body font-light text-[8px] text-offwhite/30">min</span>
            </div>
            <button
              disabled={pending}
              onClick={() => act(() => updateService(service.id, { price: parseFloat(price), duration: parseInt(duration) }))}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-sage/12 border border-sage/25 text-sage-light hover:bg-sage/22 transition-all disabled:opacity-40"
            >
              {pending ? '…' : 'Ok'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/25 hover:text-offwhite/50 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {feedback && (
        <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-2">{feedback}</p>
      )}
    </div>
  )
}
