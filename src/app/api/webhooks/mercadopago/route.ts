import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { markOrderPaid, releaseOrderStockAndCoupon } from '@/lib/checkout/orderLifecycle'

function mapStatus(mpStatus: string | undefined): 'approved' | 'pending' | 'rejected' | 'refunded' {
  if (mpStatus === 'approved') return 'approved'
  if (mpStatus === 'refunded' || mpStatus === 'charged_back') return 'refunded'
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'rejected'
  return 'pending'
}

/**
 * Mercado Pago notifies payment updates here. Never trust the notification
 * payload's own status field — it's only used to learn which payment ID
 * changed, then the authoritative status is re-fetched directly from the
 * Payment API. This is Mercado Pago's own documented pattern and sidesteps
 * needing webhook signature validation for this to be trustworthy.
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const body = await request.json().catch(() => null)
    const paymentId = body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id')
    const topic = body?.type ?? url.searchParams.get('type')

    if (!paymentId || (topic && topic !== 'payment')) {
      return NextResponse.json({ ok: true })
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado — webhook ignorado.')
      return NextResponse.json({ ok: true })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const payment = new Payment(client)
    const result = await payment.get({ id: String(paymentId) })

    const db = await createServiceClient()
    const { data: orderPayment } = await db
      .from('order_payments')
      .select('id, order_id, status')
      .eq('provider_payment_id', String(result.id))
      .maybeSingle()

    if (!orderPayment) return NextResponse.json({ ok: true })

    const mappedStatus = mapStatus(result.status)
    if (orderPayment.status === mappedStatus) return NextResponse.json({ ok: true })

    await db.from('order_payments').update({
      status: mappedStatus,
      paid_at: mappedStatus === 'approved' ? new Date().toISOString() : null,
    }).eq('id', orderPayment.id)

    if (mappedStatus === 'approved') {
      await markOrderPaid(db, orderPayment.order_id)
    } else if (mappedStatus === 'rejected') {
      await releaseOrderStockAndCoupon(db, orderPayment.order_id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Unexpected error in POST /api/webhooks/mercadopago:', error)
    // Always 200 — Mercado Pago retries aggressively on non-2xx, and a
    // transient error here shouldn't trigger a storm of redelivery.
    return NextResponse.json({ ok: true })
  }
}
