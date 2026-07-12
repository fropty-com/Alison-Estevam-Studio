import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { getLoyaltyProgress } from '@/lib/loyalty'
import { ProfileHeader } from '@/components/profile/ProfileHeader'

export const metadata: Metadata = { title: 'Cartão Fidelidade — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function FidelidadePage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any
  const loyalty = await getLoyaltyProgress(db, session.clientId)
  const hasActivity = loyalty.completedCount > 0
  const pct = Math.min(100, (loyalty.progress / loyalty.visitsRequired) * 100)

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Cartão Fidelidade" />

      <div className="max-w-[560px] mx-auto px-8 py-10">
        {!hasActivity ? (
          <div className="border border-offwhite/8 px-8 py-16 text-center">
            <p className="font-display font-light text-[20px] text-offwhite/70 mb-[10px]">Ainda não há cartões</p>
            <p className="font-body font-light text-[12px] text-offwhite/35 leading-[1.7] max-w-[320px] mx-auto">
              Quando você concluir seu primeiro atendimento, seu cartão de fidelidade aparece aqui.
            </p>
          </div>
        ) : (
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
                <div className="w-full h-[6px] bg-offwhite/6 rounded-none mb-[12px]">
                  <div className="h-full bg-gold/60 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="font-body font-light text-[12px] text-offwhite/45">
                  Faltam {loyalty.visitsRequired - loyalty.progress} para ganhar: <span className="text-offwhite/70">{loyalty.rewardDescription}</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
