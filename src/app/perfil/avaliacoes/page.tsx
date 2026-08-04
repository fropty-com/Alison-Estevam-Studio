import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ReviewsSection } from '@/components/profile/ReviewsSection'

export const metadata: Metadata = { title: 'Avaliações — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function AvaliacoesPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()

  const [reviewsRes, completedRes] = await Promise.all([
    db.from('reviews')
      .select('id, rating, comment, created_at, appointment_id, services(name)')
      .eq('client_id', session.clientId)
      .order('created_at', { ascending: false }),
    db.from('appointments')
      .select('id, services(name), time_slots(date)')
      .eq('client_id', session.clientId)
      .eq('status', 'completed'),
  ])

  const reviewsRaw = reviewsRes.data ?? []
  const reviewedIds = new Set(reviewsRaw.map(r => r.appointment_id))
  const pendingRaw = (completedRes.data ?? []).filter(a => !reviewedIds.has(a.id))

  const reviews = reviewsRaw.map(r => {
    const svc = Array.isArray(r.services) ? r.services[0] : r.services
    return { id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, serviceName: svc?.name ?? '—' }
  })
  const pending = pendingRaw.map(a => {
    const svc = Array.isArray(a.services) ? a.services[0] : a.services
    return { id: a.id, serviceName: svc?.name ?? '—' }
  })

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Avaliações" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <ReviewsSection pending={pending} reviews={reviews} />
      </div>
    </div>
  )
}
