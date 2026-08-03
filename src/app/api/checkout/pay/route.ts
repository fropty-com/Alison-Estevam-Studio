import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { BRAND } from '@/config/brand'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { markOrderPaid, releaseOrderStockAndCoupon } from '@/lib/checkout/orderLifecycle'

// MP's payment_type_id groups Pix under "bank_transfer" (there's no
// "pix" payment_type_id) — this maps the API's type back to the method
// values order_payments.method actually accepts.
function mapPaymentMethod(paymentTypeId: string | undefined): 'pix' | 'debit_card' | 'credit_card' {
  if (paymentTypeId === 'bank_transfer') return 'pix'
  if (paymentTypeId === 'debit_card') return 'debit_card'
  return 'credit_card'
}

function mapStatus(mpStatus: string | undefined): 'approved' | 'pending' | 'rejected' {
  if (mpStatus === 'approved') return 'approved'
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'rejected'
  return 'pending'
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`checkout-pay:${ip}`, 600, 10)
    if (!allowed) {
      return NextResponse.json({ error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.' }, { status: 429 })
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado.')
      return NextResponse.json({ error: 'Pagamento online indisponível no momento.' }, { status: 500 })
    }

    const body = await request.json()
    const orderId = typeof body.orderId === 'string' ? body.orderId : ''
    if (!orderId) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 422 })

    const db = await createServiceClient()
    const { data: order } = await db
      .from('orders')
      .select('id, reference_code, total, status')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    if (order.status !== 'aguardando_pagamento') {
      return NextResponse.json({ error: 'Este pedido já foi processado.' }, { status: 409 })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const payment = new Payment(client)

    let result
    try {
      result = await payment.create({
        body: {
          transaction_amount: Number(order.total),
          token: typeof body.token === 'string' ? body.token : undefined,
          description: `Pedido ${order.reference_code} — ${BRAND.fullName}`,
          installments: typeof body.installments === 'number' ? body.installments : 1,
          payment_method_id: body.payment_method_id,
          payer: {
            email: body.payer?.email,
            identification: body.payer?.identification,
          },
        },
      })
    } catch (err) {
      console.error('Mercado Pago payment.create failed:', err)
      return NextResponse.json({ error: 'Erro ao processar pagamento. Tente novamente.' }, { status: 502 })
    }

    const status = mapStatus(result.status)
    const method = mapPaymentMethod(result.payment_type_id)

    await db.from('order_payments').insert({
      order_id: order.id,
      method,
      provider: 'mercado_pago',
      provider_payment_id: result.id ? String(result.id) : null,
      status,
      amount: order.total,
      paid_at: status === 'approved' ? new Date().toISOString() : null,
    })

    if (status === 'approved') {
      await markOrderPaid(db, order.id)
    } else if (status === 'rejected') {
      await releaseOrderStockAndCoupon(db, order.id)
    }
    // status === 'pending' (Pix): order stays aguardando_pagamento, webhook confirms later.

    return NextResponse.json({
      status,
      referenceCode: order.reference_code,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code ?? null,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/checkout/pay:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
