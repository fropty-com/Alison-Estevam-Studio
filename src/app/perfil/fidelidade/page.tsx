import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { getLoyaltyProgress } from '@/lib/loyalty'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { LoyaltyCard } from '@/components/profile/LoyaltyCard'

export const metadata: Metadata = { title: 'Cartão Fidelidade — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function FidelidadePage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()
  const loyalty = await getLoyaltyProgress(db, session.clientId)

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Cartão Fidelidade" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <h1 className="sr-only">Cartão Fidelidade</h1>
        <LoyaltyCard loyalty={loyalty} />
      </div>
    </div>
  )
}
