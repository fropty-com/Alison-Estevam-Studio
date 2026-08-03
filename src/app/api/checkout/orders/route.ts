import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createOrderSchema } from '@/lib/validations/checkout'
import { formatWhatsApp } from '@/lib/utils'
import { validateCoupon, redeemCoupon } from '@/lib/coupons'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`checkout:${ip}`, 600, 8)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de compra. Aguarde alguns minutos e tente novamente.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 422 })
    }
    const { name, whatsapp, email, items, fulfillmentMethod, shippingRateId, shippingAddress, couponCode } = parsed.data

    const db = await createServiceClient()

    // 1. Live product data — price and stock are never trusted from the
    // client, only the productId + desired quantity are.
    const productIds = items.map(i => i.productId)
    const { data: products } = await db
      .from('products')
      .select('id, name, price, stock_quantity, active')
      .in('id', productIds)

    const productById = new Map((products ?? []).map(p => [p.id, p]))
    for (const item of items) {
      const product = productById.get(item.productId)
      if (!product || !product.active) {
        return NextResponse.json({ error: 'Um dos produtos do carrinho não está mais disponível.' }, { status: 409 })
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json({ error: `Estoque insuficiente para "${product.name}".` }, { status: 409 })
      }
    }

    const subtotal = items.reduce((sum, item) => sum + Number(productById.get(item.productId)!.price) * item.quantity, 0)

    // 2. Shipping
    let shippingCost = 0
    if (fulfillmentMethod === 'envio') {
      const { data: rate } = await db
        .from('shipping_rates')
        .select('id, price, active')
        .eq('id', shippingRateId!)
        .maybeSingle()
      if (!rate || !rate.active) {
        return NextResponse.json({ error: 'Faixa de frete inválida.' }, { status: 422 })
      }
      shippingCost = Number(rate.price)
    }

    // 3. Coupon — optimistic pre-check now, atomic redemption after stock is
    // reserved (same two-step pattern as the appointment booking route).
    let appliedCouponId: string | null = null
    if (couponCode) {
      const result = await validateCoupon(db, couponCode, subtotal)
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 422 })
      }
      appliedCouponId = result.coupon.id
    }

    // 4. Reserve stock atomically, item by item. On any failure, roll back
    // everything already reserved in this request — see migration
    // 047_reserve_product_stock for why this can't be a read-then-write.
    const reserved: { productId: string; quantity: number }[] = []
    for (const item of items) {
      const { data: reservation } = await db
        .rpc('reserve_product_stock', { p_product_id: item.productId, p_quantity: item.quantity })
        .maybeSingle()
      if (!reservation) {
        for (const r of reserved) {
          await db.rpc('release_product_stock', { p_product_id: r.productId, p_quantity: r.quantity })
        }
        const product = productById.get(item.productId)
        return NextResponse.json({ error: `"${product?.name ?? 'Produto'}" ficou sem estoque enquanto você finalizava a compra.` }, { status: 409 })
      }
      reserved.push({ productId: item.productId, quantity: item.quantity })
    }

    const rollbackStock = async () => {
      for (const r of reserved) {
        await db.rpc('release_product_stock', { p_product_id: r.productId, p_quantity: r.quantity })
      }
    }

    // 5. Redeem coupon atomically (consumes the use) — must not silently
    // apply a discount that's no longer valid.
    let discountAmount = 0
    if (appliedCouponId) {
      const redemption = await redeemCoupon(db, appliedCouponId, subtotal)
      if (!redemption.ok) {
        await rollbackStock()
        return NextResponse.json({ error: 'Este cupom não está mais disponível. Tente novamente sem o cupom.' }, { status: 409 })
      }
      discountAmount = redemption.discountAmount
    }

    const total = Math.max(0, subtotal + shippingCost - discountAmount)

    // 6. Find or create client
    const formattedWhatsapp = formatWhatsApp(whatsapp)
    let clientId: string
    const { data: existingClient } = await db
      .from('clients')
      .select('id')
      .eq('whatsapp', formattedWhatsapp)
      .maybeSingle()

    if (existingClient) {
      clientId = existingClient.id
      await db.from('clients').update({ name, ...(email && { email }) }).eq('id', clientId)
    } else {
      const { data: newClient, error: clientError } = await db
        .from('clients')
        .insert({ name, whatsapp: formattedWhatsapp, email: email || null })
        .select('id')
        .single()
      if (clientError || !newClient) {
        await rollbackStock()
        if (appliedCouponId) await db.rpc('release_coupon', { p_coupon_id: appliedCouponId })
        return NextResponse.json({ error: 'Erro ao registrar cliente.' }, { status: 500 })
      }
      clientId = newClient.id
    }

    // 7. Reference code
    const { data: referenceCode, error: refError } = await db.rpc('next_order_reference')
    if (refError || !referenceCode) {
      await rollbackStock()
      if (appliedCouponId) await db.rpc('release_coupon', { p_coupon_id: appliedCouponId })
      return NextResponse.json({ error: 'Erro ao gerar código do pedido.' }, { status: 500 })
    }

    // 8. Create order + items
    const { data: order, error: orderError } = await db
      .from('orders')
      .insert({
        reference_code: referenceCode,
        client_id: clientId,
        status: 'aguardando_pagamento',
        fulfillment_method: fulfillmentMethod,
        shipping_address: fulfillmentMethod === 'envio' ? shippingAddress : null,
        shipping_rate_id: fulfillmentMethod === 'envio' ? shippingRateId : null,
        shipping_cost: shippingCost,
        subtotal,
        discount_amount: discountAmount,
        total,
        coupon_id: appliedCouponId,
      })
      .select('id, reference_code')
      .single()

    if (orderError || !order) {
      await rollbackStock()
      if (appliedCouponId) await db.rpc('release_coupon', { p_coupon_id: appliedCouponId })
      return NextResponse.json({ error: 'Erro ao criar pedido.' }, { status: 500 })
    }

    const { error: itemsError } = await db.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: Number(productById.get(item.productId)!.price),
      }))
    )
    if (itemsError) console.error('order_items insert error:', itemsError)

    if (appliedCouponId) {
      const { error: redemptionLogError } = await db.from('coupon_redemptions').insert({
        coupon_id: appliedCouponId,
        order_id: order.id,
        discount_amount: discountAmount,
      })
      if (redemptionLogError) console.error('coupon_redemptions insert error:', redemptionLogError)
    }

    return NextResponse.json({
      orderId: order.id,
      referenceCode: order.reference_code,
      subtotal,
      shippingCost,
      discountAmount,
      total,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/checkout/orders:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
