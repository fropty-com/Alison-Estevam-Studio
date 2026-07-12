import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ReviewForm } from '@/components/profile/ReviewForm'

export const metadata: Metadata = { title: 'Avaliações — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function AvaliacoesPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any

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

  const reviews = (reviewsRes.data ?? []) as any[]
  const reviewedIds = new Set(reviews.map(r => r.appointment_id))
  const pending = ((completedRes.data ?? []) as any[]).filter(a => !reviewedIds.has(a.id))

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Avaliações" />

      <div className="max-w-[560px] mx-auto px-8 pt-[122px] pb-10">
        {pending.length > 0 && (
          <div className="mb-[34px]">
            <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/40 mb-[12px]">
              Avalie seu atendimento
            </p>
            <div className="flex flex-col gap-[10px]">
              {pending.map(a => {
                const svc = Array.isArray(a.services) ? a.services[0] : a.services
                return <ReviewForm key={a.id} appointmentId={a.id} serviceName={svc?.name ?? '—'} />
              })}
            </div>
          </div>
        )}

        <div>
          <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/40 mb-[12px]">
            Suas avaliações
          </p>

          {reviews.length === 0 ? (
            <div className="border border-offwhite/8 px-8 py-14 text-center">
              <p className="font-body font-light text-[13px] text-offwhite/40 mb-[6px]">
                Você ainda não fez avaliações.
              </p>
              <p className="font-body font-light text-[11px] text-offwhite/25">
                Após concluir um atendimento, você poderá avaliar sua experiência aqui.
              </p>
            </div>
          ) : (
            <div className="border border-offwhite/7 divide-y divide-offwhite/6">
              {reviews.map(r => {
                const svc = Array.isArray(r.services) ? r.services[0] : r.services
                return (
                  <div key={r.id} className="px-6 py-5">
                    <div className="flex items-center justify-between mb-[6px]">
                      <p className="font-body font-light text-[12px] text-offwhite/70">{svc?.name ?? '—'}</p>
                      <span className="font-data text-gold text-[13px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && (
                      <p className="font-body font-light text-[12px] text-offwhite/45 leading-[1.6] mb-[6px]">{r.comment}</p>
                    )}
                    <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.08em]">
                      {format(parseISO(r.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
