import { createServiceClient } from '@/lib/supabase/server'
import { ProductsManager } from '@/components/admin/ProductsManager'
import { ProductsPageTabs } from '@/components/admin/ProductsPageTabs'
import { ShippingRateRow } from '@/components/admin/ShippingRateRow'
import { AddShippingRateForm } from '@/components/admin/AddShippingRateForm'
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

  const [productsRes, shippingRes] = await Promise.all([
    db.from('products')
      .select('id, name, category, description, price, compare_at_price, stock_quantity, image_url, active')
      .order('created_at', { ascending: false }),
    db.from('shipping_rates')
      .select('id, label, state, price, active')
      .order('created_at', { ascending: true }),
  ])

  const products = productsRes.data ?? []
  const shippingRates = shippingRes.data ?? []

  const activeProducts = products.filter(p => p.active)
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.stock_quantity, 0)
  const totalStockValue = activeProducts.reduce((sum, p) => sum + p.stock_quantity * Number(p.price), 0)

  return (
    <div className="px-6 py-8 space-y-10">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">{t.products.eyebrow}</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.products.title}</h1>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.products.cards.active}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{activeProducts.length}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.products.cards.activeSub}</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.products.cards.stockUnits}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{totalStockUnits}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.products.cards.stockUnitsSub}</p>
        </div>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.products.cards.stockValue}</p>
          <p className="font-data text-[26px] text-sage-light leading-none mb-2">{fmt(totalStockValue)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.products.cards.stockValueSub}</p>
        </div>
      </div>

      <ProductsPageTabs
        productsSlot={<ProductsManager products={products} />}
        shippingSlot={
          <section className="space-y-4">
            <AddShippingRateForm />
            {shippingRates.length === 0 ? (
              <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">
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
      />
    </div>
  )
}
