import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { BRAND } from '@/config/brand'
import { CheckoutClient } from './CheckoutClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Finalizar compra — ${BRAND.fullName}` }

export default async function CheckoutPage() {
  const db = await createServiceClient()
  const { data } = await db
    .from('shipping_rates')
    .select('id, label, state, price')
    .eq('active', true)
    .order('price', { ascending: true })

  return <CheckoutClient shippingRates={data ?? []} mercadoPagoPublicKey={process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? null} />
}
