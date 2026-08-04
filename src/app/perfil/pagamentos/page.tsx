import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { PaymentsListSection } from '@/components/profile/PaymentsListSection'

export const metadata: Metadata = { title: 'Pagamentos — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function PagamentosPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()
  const { data: raw } = await db
    .from('payments')
    .select('id, method, gross_amount, paid_at, appointments!inner(client_id)')
    .eq('appointments.client_id', session.clientId)
    .order('paid_at', { ascending: false })

  const payments = (raw ?? []).map(p => ({ id: p.id, method: p.method, grossAmount: Number(p.gross_amount), paidAt: p.paid_at }))

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Pagamentos" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <PaymentsListSection payments={payments} />
      </div>
    </div>
  )
}
