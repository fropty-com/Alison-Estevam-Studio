import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { OrdersListSection } from '@/components/profile/OrdersListSection'

export const metadata: Metadata = { title: 'Meus Pedidos — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()
  const { data: raw } = await db
    .from('orders')
    .select('id, reference_code, status, total, created_at, order_items(quantity, products(name))')
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })

  const orders = (raw ?? []).map(o => {
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
      <ProfileHeader title="Meus Pedidos" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <OrdersListSection orders={orders} />
      </div>
    </div>
  )
}
