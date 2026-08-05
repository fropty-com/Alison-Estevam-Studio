import { createServiceClient } from '@/lib/supabase/server'
import { ProductsManager } from '@/components/admin/ProductsManager'
import { ProductsPageTabs } from '@/components/admin/ProductsPageTabs'
import { ShippingRateRow } from '@/components/admin/ShippingRateRow'
import { AddShippingRateForm } from '@/components/admin/AddShippingRateForm'
import { OrderRow, type OrderListItem } from '@/components/admin/OrderRow'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'

export const dynamic = 'force-dynamic'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function ProdutosPage() {
  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)

  const [productsRes, shippingRes, ordersRes] = await Promise.all([
    db.from('products')
      .select('id, name, category, description, price, compare_at_price, stock_quantity, image_url, active')
      .order('created_at', { ascending: false }),
    db.from('shipping_rates')
      .select('id, label, state, price, active')
      .order('created_at', { ascending: true }),
    db.from('orders')
      .select('id, reference_code, status, fulfillment_method, total, created_at, clients(name, avatar_url), order_items(quantity, products(name))')
      .neq('status', 'aguardando_pagamento')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const products = productsRes.data ?? []
  const shippingRates = shippingRes.data ?? []

  const orders: OrderListItem[] = (ordersRes.data ?? []).map(o => {
    const client = Array.isArray(o.clients) ? o.clients[0] : o.clients
    const items = o.order_items ?? []
    const itemsSummary = items
      .map(i => {
        const product = Array.isArray(i.products) ? i.products[0] : i.products
        return `${product?.name ?? 'Produto'} ×${i.quantity}`
      })
      .join(', ')
    return {
      id: o.id,
      referenceCode: o.reference_code,
      status: o.status,
      fulfillmentMethod: o.fulfillment_method as 'envio' | 'retirada',
      total: Number(o.total),
      createdAt: o.created_at,
      clientName: client?.name ?? '—',
      clientAvatarUrl: client?.avatar_url ?? null,
      itemsSummary: itemsSummary || '—',
    }
  })

  const activeProducts = products.filter(p => p.active)
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.stock_quantity, 0)
  const totalStockValue = activeProducts.reduce((sum, p) => sum + p.stock_quantity * Number(p.price), 0)
  const lowStockCount = activeProducts.filter(p => p.stock_quantity <= 3).length

  return (
    <div className="px-6 py-8 space-y-10">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/55 mb-1">{t.products.eyebrow}</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.products.title}</h1>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/55 mb-3">{t.products.cards.active}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{activeProducts.length}</p>
          <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.12em]">{t.products.cards.activeSub}</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/55 mb-3">{t.products.cards.stockUnits}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{totalStockUnits}</p>
          <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.12em]">{t.products.cards.stockUnitsSub}</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/55 mb-3">{t.products.cards.stockValue}</p>
          <p className="font-data text-[26px] text-sage-light leading-none mb-2">{fmt(totalStockValue)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.12em]">{t.products.cards.stockValueSub}</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/55 mb-3">{t.products.cards.lowStock}</p>
          <p className={`font-data text-[26px] leading-none mb-2 ${lowStockCount > 0 ? 'text-error/80' : 'text-offwhite'}`}>{lowStockCount}</p>
          <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.12em]">{t.products.cards.lowStockSub}</p>
        </div>
      </div>

      <ProductsPageTabs
        productsSlot={<ProductsManager products={products} />}
        shippingSlot={
          <section className="space-y-4">
            <AddShippingRateForm />
            {shippingRates.length === 0 ? (
              <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">
                {t.products.shipping.empty}
              </p>
            ) : (
              <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
                {shippingRates.map(r => (
                  <ShippingRateRow key={r.id} rate={r} />
                ))}
              </div>
            )}
          </section>
        }
        ordersSlot={
          orders.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">
              {t.products.orders.empty}
            </p>
          ) : (
            <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
              {orders.map(o => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          )
        }
      />
    </div>
  )
}
