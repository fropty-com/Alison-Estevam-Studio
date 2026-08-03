import { sendOrderConfirmationEmail } from '@/lib/email/orderConfirmation'

type Db = any // eslint-disable-line

/**
 * Marks an order as paid and sends the confirmation email. Shared between
 * the synchronous card-payment path (approved instantly) and the async
 * Mercado Pago webhook (Pix, or a card approval that lands after the
 * initial request already returned) — both need identical side effects.
 */
export async function markOrderPaid(db: Db, orderId: string): Promise<void> {
  await db.from('orders').update({ status: 'pago', updated_at: new Date().toISOString() }).eq('id', orderId)

  const { data: order } = await db
    .from('orders')
    .select('reference_code, subtotal, shipping_cost, discount_amount, total, fulfillment_method, clients(name, email, receive_reminder_emails)')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return

  const client = Array.isArray(order.clients) ? order.clients[0] : order.clients
  if (!client?.email || client.receive_reminder_emails === false) return

  const { data: items } = await db
    .from('order_items')
    .select('quantity, unit_price, products(name)')
    .eq('order_id', orderId)
  const orderItems = (items ?? []).map((item: { quantity: number; unit_price: number; products: { name: string }[] | { name: string } | null }) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products
    return { name: product?.name ?? 'Produto', quantity: item.quantity, unitPrice: Number(item.unit_price) }
  })

  await sendOrderConfirmationEmail({
    clientName: client.name,
    clientEmail: client.email,
    referenceCode: order.reference_code,
    items: orderItems,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shipping_cost),
    discountAmount: Number(order.discount_amount),
    total: Number(order.total),
    fulfillmentMethod: order.fulfillment_method as 'envio' | 'retirada',
  })
}

/**
 * Rolls back a failed/rejected order: releases the reserved stock and the
 * coupon use (both atomically consumed at order creation — see
 * migration 047 and redeem_coupon in 022), then marks the order cancelled.
 */
export async function releaseOrderStockAndCoupon(db: Db, orderId: string): Promise<void> {
  const { data: order } = await db.from('orders').select('coupon_id, status').eq('id', orderId).maybeSingle()
  if (!order || order.status !== 'aguardando_pagamento') return

  const { data: items } = await db.from('order_items').select('product_id, quantity').eq('order_id', orderId)
  for (const item of items ?? []) {
    await db.rpc('release_product_stock', { p_product_id: item.product_id, p_quantity: item.quantity })
  }
  if (order.coupon_id) {
    await db.rpc('release_coupon', { p_coupon_id: order.coupon_id })
  }

  await db.from('orders').update({ status: 'cancelado', updated_at: new Date().toISOString() }).eq('id', orderId)
}
