'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateService, deleteService } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function ServiceRow({ service, appointmentCount }: { service: {
  id: string; name: string; description: string | null
  duration: number; price: number; active: boolean; position: number
  hidden_from_list?: boolean
}, appointmentCount: number }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending,   startTransition] = useTransition()
  const [editing,   setEditing]  = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteService(service.id)
      if (res?.error) { setFeedback(res.error); setConfirmDelete(false) }
      else router.refresh()
    })
  }

  return (
    <div className={cn('h-full bg-offwhite/5 border border-offwhite/[0.07] px-5 py-4 transition-all duration-200', !service.active && 'opacity-45')}>
      <div className="flex items-start gap-4">
        {/* Active toggle */}
        <button
          disabled={pending}
          onClick={() => act(() => updateService(service.id, { active: !service.active }))}
          className={cn(
            'mt-[2px] w-[34px] h-[20px] rounded-full border transition-all duration-300 relative shrink-0 disabled:opacity-40',
            service.active ? 'bg-sage/25 border-sage/40' : 'bg-offwhite/5 border-offwhite/15'
          )}
          aria-label={service.active ? t.services.row.deactivate : t.services.row.activate}
        >
          <span className={cn(
            'absolute top-[3px] w-[12px] h-[12px] rounded-full transition-all duration-300',
            service.active ? 'left-[18px] bg-sage' : 'left-[3px] bg-offwhite/25'
          )} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-body font-light text-[13px] text-offwhite">{service.name}</p>
            {service.hidden_from_list && (
              <span
                title={t.services.row.careBadgeTitle}
                className="font-body font-light text-[7px] tracking-[0.25em] uppercase px-[6px] py-[2px] border border-offwhite/15 text-offwhite/35 shrink-0"
              >
                {t.services.row.careBadge}
              </span>
            )}
          </div>
          {service.description && (
            <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mt-[2px]">
              {service.description}
            </p>
          )}
        </div>

        {!editing ? (
          <div className="flex items-start gap-5 shrink-0">
            <div className="text-right">
              <p className="font-data text-[16px] text-offwhite/70 leading-none">R$ {service.price}</p>
              <p className="font-body font-light text-[8.5px] text-offwhite/25 tracking-[0.12em] mt-[3px]">{service.duration}min</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/25 hover:text-offwhite/55 transition-colors px-2 py-1 border border-transparent hover:border-offwhite/[0.12]"
            >
              {t.services.row.edit}
            </button>
            {appointmentCount === 0 && (
              !confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-error/35 hover:text-error/65 transition-colors px-2 py-1 border border-transparent hover:border-error/20"
                >
                  {t.services.row.delete}
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    disabled={pending}
                    onClick={handleDelete}
                    className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-error text-offwhite hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {pending ? '…' : t.services.row.confirm}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/25 hover:text-offwhite/50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-body font-light text-[8px] text-offwhite/30">R$</span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-16 bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-data text-lg px-2 py-1 outline-none rounded-none focus:border-gold/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-14 bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-body font-light text-lg px-2 py-1 outline-none rounded-none focus:border-gold/50 transition-colors"
              />
              <span className="font-body font-light text-[8px] text-offwhite/30">min</span>
            </div>
            <button
              disabled={pending}
              onClick={() => act(() => updateService(service.id, { price: parseFloat(price), duration: parseInt(duration) }))}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-sage/15 border border-sage/25 text-sage-light hover:bg-sage/25 transition-all disabled:opacity-40"
            >
              {pending ? '…' : t.services.row.ok}
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
