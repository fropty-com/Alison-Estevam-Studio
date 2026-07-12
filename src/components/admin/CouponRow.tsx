'use client'

import { useState, useTransition } from 'react'
import { toggleCouponActive } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function CouponRow({ coupon }: {
  coupon: {
    id: string; code: string; discount_type: 'percentage' | 'fixed'; discount_value: number
    max_uses: number | null; uses_count: number; expires_at: string | null; active: boolean
  }
}) {
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  const discountLabel = coupon.discount_type === 'percentage'
    ? `${coupon.discount_value}%`
    : `R$ ${coupon.discount_value}`

  const usageLabel = coupon.max_uses !== null
    ? `${coupon.uses_count} / ${coupon.max_uses} usos`
    : `${coupon.uses_count} usos`

  const expired = coupon.expires_at !== null && coupon.expires_at < new Date().toISOString().slice(0, 10)

  return (
    <div className={cn('px-5 py-4', !coupon.active && 'opacity-45')}>
      <div className="flex items-center gap-4">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            const res = await toggleCouponActive(coupon.id, !coupon.active)
            if (res?.error) setFeedback(res.error); else setFeedback(null)
          })}
          className={cn(
            'w-[34px] h-[20px] rounded-full border transition-all duration-300 relative shrink-0 disabled:opacity-40',
            coupon.active ? 'bg-sage/25 border-sage/40' : 'bg-offwhite/5 border-offwhite/15'
          )}
          aria-label={coupon.active ? 'Desativar' : 'Ativar'}
        >
          <span className={cn(
            'absolute top-[3px] w-[12px] h-[12px] rounded-full transition-all duration-300',
            coupon.active ? 'left-[18px] bg-sage' : 'left-[3px] bg-offwhite/25'
          )} />
        </button>

        <span className="font-data text-[13px] text-offwhite/80 w-[100px] shrink-0">{coupon.code}</span>
        <span className="font-body font-light text-[12px] text-gold w-[70px] shrink-0">{discountLabel}</span>
        <span className="font-body font-light text-[11px] text-offwhite/40 flex-1">{usageLabel}</span>

        {coupon.expires_at && (
          <span className={cn('font-body font-light text-[10px] tracking-[0.1em] shrink-0', expired ? 'text-error/60' : 'text-offwhite/30')}>
            {expired ? 'expirado' : `até ${coupon.expires_at.split('-').reverse().join('/')}`}
          </span>
        )}
      </div>
      {feedback && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-2">{feedback}</p>}
    </div>
  )
}
