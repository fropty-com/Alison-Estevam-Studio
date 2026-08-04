import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { getLoyaltyProgress } from '@/lib/loyalty'
import { AccordionSection } from '@/components/profile/AccordionSection'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { EditClientProfileForm } from '@/components/profile/EditClientProfileForm'
import { LoyaltyCard } from '@/components/profile/LoyaltyCard'
import { AccountSettingsSection } from '@/components/profile/AccountSettingsSection'
import { ReviewsSection } from '@/components/profile/ReviewsSection'
import { PaymentsListSection } from '@/components/profile/PaymentsListSection'
import { OrdersListSection } from '@/components/profile/OrdersListSection'
import { maskPhoneInput } from '@/lib/utils'

export const metadata: Metadata = { title: 'Perfil — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

const h2Cls = 'font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/45 mb-4'

export default async function PerfilPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()

  const [{ data: client }, { data: reviewsRaw }, { data: completedRaw }, { data: paymentsRaw }, { data: ordersRaw }, loyalty] = await Promise.all([
    db.from('clients')
      .select('name, whatsapp, email, avatar_url, created_at, consent_whatsapp, receive_reminder_emails')
      .eq('id', session.clientId)
      .single(),
    db.from('reviews')
      .select('id, rating, comment, created_at, appointment_id, services(name)')
      .eq('client_id', session.clientId)
      .order('created_at', { ascending: false }),
    db.from('appointments')
      .select('id, services(name), time_slots(date)')
      .eq('client_id', session.clientId)
      .eq('status', 'completed'),
    db.from('payments')
      .select('id, method, gross_amount, paid_at, appointments!inner(client_id)')
      .eq('appointments.client_id', session.clientId)
      .order('paid_at', { ascending: false }),
    db.from('orders')
      .select('id, reference_code, status, total, created_at, order_items(quantity, products(name))')
      .eq('client_id', session.clientId)
      .order('created_at', { ascending: false }),
    getLoyaltyProgress(db, session.clientId),
  ])

  if (!client) redirect('/entrar')

  const initialPhone = client.whatsapp ? maskPhoneInput(client.whatsapp.replace(/^\+?55/, '')) : ''
  const memberSinceFull = client.created_at
    ? format(parseISO(client.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'
  const memberSinceShort = client.created_at
    ? format(parseISO(client.created_at), "MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  const reviewsList = reviewsRaw ?? []
  const reviewedIds = new Set(reviewsList.map(r => r.appointment_id))
  const reviews = reviewsList.map(r => {
    const svc = Array.isArray(r.services) ? r.services[0] : r.services
    return { id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, serviceName: svc?.name ?? '—' }
  })
  const pendingReviews = (completedRaw ?? [])
    .filter(a => !reviewedIds.has(a.id))
    .map(a => {
      const svc = Array.isArray(a.services) ? a.services[0] : a.services
      return { id: a.id, serviceName: svc?.name ?? '—' }
    })

  const payments = (paymentsRaw ?? []).map(p => ({ id: p.id, method: p.method, grossAmount: Number(p.gross_amount), paidAt: p.paid_at }))

  const orders = (ordersRaw ?? []).map(o => {
    const items = o.order_items ?? []
    const itemsSummary = items
      .map(i => {
        const product = Array.isArray(i.products) ? i.products[0] : i.products
        return `${product?.name ?? 'Produto'} ×${i.quantity}`
      })
      .join(', ')
    return { id: o.id, referenceCode: o.reference_code, status: o.status, total: Number(o.total), createdAt: o.created_at, itemsSummary }
  })

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Perfil" backHref="/conta" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <div className="mb-8">
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Cliente</p>
          <h1 className="font-display font-light text-[26px] text-offwhite tracking-[0.03em]">Meu perfil</h1>
          <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.1em] mt-1">
            Seus dados de cadastro e informações da conta.
          </p>
        </div>

        <section className="mb-8">
          <h2 className={h2Cls}>Dados do perfil</h2>
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <EditClientProfileForm
              initialName={client.name}
              initialPhone={initialPhone}
              initialEmail={client.email ?? ''}
              initialAvatarUrl={client.avatar_url}
            />
          </div>
        </section>

        <div className="border border-offwhite/[0.07]">
          <AccordionSection icon="◆" label="Cartão Fidelidade">
            <LoyaltyCard loyalty={loyalty} />
          </AccordionSection>
          <AccordionSection icon="◻" label="Detalhes da conta">
            <AccountSettingsSection
              consentWhatsapp={client.consent_whatsapp}
              receiveReminderEmails={client.receive_reminder_emails}
              memberSince={memberSinceShort}
            />
          </AccordionSection>
          <AccordionSection icon="★" label="Avaliações">
            <ReviewsSection pending={pendingReviews} reviews={reviews} />
          </AccordionSection>
          <AccordionSection icon="▤" label="Pagamentos">
            <PaymentsListSection payments={payments} />
          </AccordionSection>
          <AccordionSection icon="▣" label="Meus Pedidos">
            <OrdersListSection orders={orders} />
          </AccordionSection>
        </div>

        <p className="font-body font-light text-[9.5px] text-offwhite/20 tracking-[0.08em] mt-6 text-center">
          Cliente desde {memberSinceFull}.
        </p>
      </div>
    </div>
  )
}
