'use client'

import { useState, useTransition } from 'react'
import { updateShippingRate, deleteShippingRate } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export interface ShippingRate {
  id: string
  label: string
  state: string | null
  price: number
  active: boolean
}

export function ShippingRateRow({ rate }: { rate: ShippingRate }) {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [label, setLabel] = useState(rate.label)
  const [state, setState] = useState(rate.state ?? '')
  const [price, setPrice] = useState(String(rate.price))
  const [feedback, setFeedback] = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else { setFeedback(null); setEditing(false) }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteShippingRate(rate.id)
      if (res?.error) { setFeedback(res.error); setConfirmDelete(false) }
    })
  }

  return (
    <div className={cn('px-5 py-4', !rate.active && 'opacity-45')}>
      <div className="flex items-center gap-4">
        <button
          disabled={pending}
          onClick={() => act(() => updateShippingRate(rate.id, { active: !rate.active }))}
          className={cn(
            'w-[34px] h-[20px] rounded-full border transition-all duration-300 relative shrink-0 disabled:opacity-40',
            rate.active ? 'bg-sage/25 border-sage/40' : 'bg-offwhite/5 border-offwhite/15'
          )}
          aria-label={rate.active ? t.products.shipping.deactivate : t.products.shipping.activate}
        >
          <span className={cn(
            'absolute top-[3px] w-[12px] h-[12px] rounded-full transition-all duration-300',
            rate.active ? 'left-[18px] bg-sage' : 'left-[3px] bg-offwhite/25'
          )} />
        </button>

        {!editing ? (
          <>
            <span className="font-body font-light text-[13px] text-offwhite flex-1 min-w-0 truncate">{rate.label}</span>
            <span className="font-body font-light text-[10px] text-offwhite/30 tracking-[0.1em] w-[40px] shrink-0">{rate.state ?? '—'}</span>
            <span className="font-data text-[14px] text-gold w-[80px] shrink-0 text-right">
              {rate.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/25 hover:text-offwhite/55 transition-colors px-2 py-1 border border-transparent hover:border-offwhite/[0.12]"
            >
              {t.products.shipping.edit}
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-error/35 hover:text-error/65 transition-colors px-2 py-1 border border-transparent hover:border-error/20"
              >
                {t.products.shipping.delete}
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  disabled={pending}
                  onClick={handleDelete}
                  className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-error text-offwhite hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {pending ? '…' : t.products.shipping.confirm}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/25 hover:text-offwhite/50 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="flex-1 min-w-[100px] bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-body font-light text-lg px-2 py-1 outline-none rounded-none focus:border-gold/50 transition-colors"
            />
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-14 bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-body font-light text-lg px-2 py-1 outline-none rounded-none focus:border-gold/50 transition-colors uppercase"
            />
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-20 bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-data text-lg px-2 py-1 outline-none rounded-none focus:border-gold/50 transition-colors"
            />
            <button
              disabled={pending}
              onClick={() => act(() => updateShippingRate(rate.id, { label, state: state || null, price: parseFloat(price) }))}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-sage/15 border border-sage/25 text-sage-light hover:bg-sage/25 transition-all disabled:opacity-40"
            >
              {pending ? '…' : t.products.shipping.ok}
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
      {feedback && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-2">{feedback}</p>}
    </div>
  )
}
