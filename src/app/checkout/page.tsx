import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { BRAND } from '@/config/brand'
import { maskPhoneInput } from '@/lib/utils'
import { CheckoutClient } from './CheckoutClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { absolute: `Finalizar compra — ${BRAND.fullName}` } }

export default async function CheckoutPage() {
  const db = await createServiceClient()
  const { data } = await db
    .from('shipping_rates')
    .select('id, label, state, price')
    .eq('active', true)
    .order('price', { ascending: true })

  const session = await getVerifiedClientSession()
  let initialName = ''
  let initialWhatsapp = ''
  let initialEmail = ''
  if (session) {
    const { data: client } = await db
      .from('clients')
      .select('name, whatsapp, email')
      .eq('id', session.clientId)
      .single()
    if (client) {
      initialName = client.name ?? ''
      initialWhatsapp = client.whatsapp ? maskPhoneInput(client.whatsapp.replace(/^\+?55/, '')) : ''
      initialEmail = client.email ?? ''
    }
  }

  return (
    <CheckoutClient
      shippingRates={data ?? []}
      mercadoPagoPublicKey={process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? null}
      initialName={initialName}
      initialWhatsapp={initialWhatsapp}
      initialEmail={initialEmail}
    />
  )
}
