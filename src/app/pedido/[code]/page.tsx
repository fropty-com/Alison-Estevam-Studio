import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { BRAND } from '@/config/brand'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/orders'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Seu pedido — ${BRAND.fullName}` }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function PedidoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const db = await createServiceClient()

  const { data: order } = await db
    .from('orders')
    .select('id, reference_code, status, fulfillment_method, subtotal, shipping_cost, discount_amount, total, clients(name)')
    .eq('reference_code', code.toUpperCase())
    .maybeSingle()

  if (!order) notFound()

  const { data: items } = await db
    .from('order_items')
    .select('quantity, unit_price, products(name)')
    .eq('order_id', order.id)

  const client = Array.isArray(order.clients) ? order.clients[0] : order.clients

  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[95px]">
      <div className="max-w-[480px] mx-auto text-center">
        <p className="section-tag justify-center" aria-hidden="true">Pedido {order.reference_code}</p>
        <h1 className="font-display font-normal text-3xl tracking-[0.05em] uppercase text-offwhite mb-2">
          Obrigado{client?.name ? `, ${client.name.split(' ')[0]}` : ''}!
        </h1>
        <p className={`font-body font-medium text-[10px] tracking-[0.2em] uppercase mb-8 ${ORDER_STATUS_COLOR[order.status] ?? 'text-offwhite/55'}`}>
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </p>

        <div className="border border-offwhite/[0.08] p-6 text-left mb-8">
          {(items ?? []).length > 0 && (
            <div className="divide-y divide-offwhite/[0.07] mb-4">
              {(items ?? []).map((item, i) => {
                const product = Array.isArray(item.products) ? item.products[0] : item.products
                return (
                  <div key={i} className="flex justify-between py-2 gap-2">
                    <span className="font-body font-light text-[12px] text-offwhite/60 truncate">{product?.name ?? 'Produto'} × {item.quantity}</span>
                    <span className="font-data text-[12px] text-offwhite/70 shrink-0">{fmt(Number(item.unit_price) * item.quantity)}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between font-body font-light text-offwhite/55"><span>Subtotal</span><span>{fmt(Number(order.subtotal))}</span></div>
            {Number(order.shipping_cost) > 0 && (
              <div className="flex justify-between font-body font-light text-offwhite/55"><span>Frete</span><span>{fmt(Number(order.shipping_cost))}</span></div>
            )}
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between font-body font-light text-sage-light"><span>Desconto</span><span>− {fmt(Number(order.discount_amount))}</span></div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-offwhite/[0.08]">
            <span className="font-body font-light text-[10px] tracking-[0.15em] uppercase text-offwhite/55">Total</span>
            <span className="font-data italic text-xl text-gold">{fmt(Number(order.total))}</span>
          </div>
          <p className="font-body font-light text-[11px] text-offwhite/55 mt-4">
            {order.fulfillment_method === 'retirada' ? 'Retirada na loja.' : 'Envio para o endereço informado.'}
          </p>
        </div>

        <Link href="/produtos" className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/55 hover:text-offwhite/70 transition-colors">
          Continuar comprando
        </Link>
      </div>
    </div>
  )
}
