'use client'

import { useState, useTransition } from 'react'
import { redeemLoyaltyReward } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function LoyaltyCard({ clientId, progress, visitsRequired, rewardDescription, availableRewards }: {
  clientId: string
  progress: number
  visitsRequired: number
  rewardDescription: string
  availableRewards: number
}) {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const pct = Math.min(100, (progress / visitsRequired) * 100)

  const handleRedeem = () => {
    startTransition(async () => {
      const res = await redeemLoyaltyReward(clientId)
      if (res?.error) setFeedback(res.error)
      else { setFeedback(null); setConfirmOpen(false) }
    })
  }

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-3">
        {t.clients.loyalty.title}
      </p>

      {availableRewards > 0 ? (
        <div>
          <p className="font-body font-light text-[13px] text-gold mb-1">
            {t.clients.loyalty.rewardsAvailable(availableRewards)}
          </p>
          <p className="font-body font-light text-[11px] text-offwhite/55 mb-4">{rewardDescription}</p>
          {!confirmOpen ? (
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full py-[10px] font-body font-light text-[8.5px] tracking-[0.28em] uppercase border border-gold/35 bg-gold/10 text-gold hover:bg-gold/15 transition-all duration-200"
            >
              {t.clients.loyalty.redeem}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                disabled={pending}
                onClick={handleRedeem}
                className="flex-1 py-[9px] font-body font-light text-[8px] tracking-[0.22em] uppercase bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 transition-all disabled:opacity-40"
              >
                {pending ? t.clients.loyalty.registering : t.clients.loyalty.confirmRedeem}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-[9px] font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/55 hover:text-offwhite/85 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-data text-[18px] text-offwhite/70">{progress}<span className="text-offwhite/55 text-[12px]"> / {visitsRequired}</span></span>
            <span className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.1em]">
              {t.clients.loyalty.remaining(visitsRequired - progress)}
            </span>
          </div>
          <div className="w-full h-[4px] bg-offwhite/5 rounded-none mb-3">
            <div className="h-full bg-sage/45 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-body font-light text-[10.5px] text-offwhite/55">
            {t.clients.loyalty.nextReward} <span className="text-offwhite/55">{rewardDescription}</span>
          </p>
        </div>
      )}

      {feedback && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-3">{feedback}</p>}
    </div>
  )
}
