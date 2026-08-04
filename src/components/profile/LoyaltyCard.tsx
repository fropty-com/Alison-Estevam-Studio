import type { LoyaltyProgress } from '@/lib/loyalty'

export function LoyaltyCard({ loyalty }: { loyalty: LoyaltyProgress }) {
  const hasActivity = loyalty.completedCount > 0
  const pct = Math.min(100, (loyalty.progress / loyalty.visitsRequired) * 100)

  if (!hasActivity) {
    return (
      <div className="border border-offwhite/[0.08] px-8 py-14 text-center">
        <p className="font-display font-light text-[18px] text-offwhite/70 mb-[8px]">Ainda não há cartões</p>
        <p className="font-body font-light text-[12px] text-offwhite/35 leading-[1.7] max-w-[320px] mx-auto">
          Quando você concluir seu primeiro atendimento, seu cartão de fidelidade aparece aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gold/25 bg-gold/[0.03] px-7 py-8">
      <p className="font-body font-light text-[9px] tracking-[0.32em] uppercase text-gold/70 mb-[10px]">
        {loyalty.rewardDescription}
      </p>

      {loyalty.availableRewards > 0 ? (
        <>
          <p className="font-display font-light text-[24px] text-gold mb-[6px]">
            {loyalty.availableRewards > 1 ? `${loyalty.availableRewards} recompensas disponíveis` : 'Recompensa disponível'}
          </p>
          <p className="font-body font-light text-[12px] text-offwhite/45">
            Resgate no seu próximo atendimento.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-[12px]">
            <p className="font-display font-light text-[22px] text-offwhite">
              {loyalty.progress} <span className="text-offwhite/30 text-[16px]">de {loyalty.visitsRequired} cortes concluídos</span>
            </p>
          </div>
          <div className="w-full h-[6px] bg-offwhite/5 rounded-none mb-[12px]">
            <div className="h-full bg-gold/60 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-body font-light text-[12px] text-offwhite/45">
            Faltam {loyalty.visitsRequired - loyalty.progress} para ganhar: <span className="text-offwhite/70">{loyalty.rewardDescription}</span>
          </p>
        </>
      )}
    </div>
  )
}
