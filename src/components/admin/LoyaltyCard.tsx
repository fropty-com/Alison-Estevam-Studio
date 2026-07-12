'use client'

import { useState, useTransition } from 'react'
import { redeemLoyaltyReward } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function LoyaltyCard({ clientId, progress, visitsRequired, rewardDescription, availableRewards }: {
  clientId: string
  progress: number
  visitsRequired: number
  rewardDescription: string
  availableRewards: number
}) {
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
    <div className="bg-offwhite/3 border border-offwhite/7 p-6">
      <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/25 mb-3">
        Fidelidade
      </p>

      {availableRewards > 0 ? (
        <div>
          <p className="font-body font-light text-[13px] text-gold mb-1">
            {availableRewards > 1 ? `${availableRewards} recompensas disponíveis` : 'Recompensa disponível'}
          </p>
          <p className="font-body font-light text-[11px] text-offwhite/45 mb-4">{rewardDescription}</p>
          {!confirmOpen ? (
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full py-[10px] font-body font-light text-[8.5px] tracking-[0.28em] uppercase border border-gold/35 bg-gold/8 text-gold hover:bg-gold/15 transition-all duration-200"
            >
              Resgatar recompensa
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                disabled={pending}
                onClick={handleRedeem}
                className="flex-1 py-[9px] font-body font-light text-[8px] tracking-[0.22em] uppercase bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 transition-all disabled:opacity-40"
              >
                {pending ? 'Registrando…' : 'Confirmar resgate'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-[9px] font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/25 hover:text-offwhite/50 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-data text-[18px] text-offwhite/70">{progress}<span className="text-offwhite/30 text-[12px]"> / {visitsRequired}</span></span>
            <span className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em]">
              faltam {visitsRequired - progress}
            </span>
          </div>
          <div className="w-full h-[4px] bg-offwhite/6 rounded-none mb-3">
            <div className="h-full bg-sage/45 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-body font-light text-[10.5px] text-offwhite/35">
            Próxima recompensa: <span className="text-offwhite/55">{rewardDescription}</span>
          </p>
        </div>
      )}

      {feedback && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-3">{feedback}</p>}
    </div>
  )
}
