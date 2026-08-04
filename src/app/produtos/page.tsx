import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Produtos — ${BRAND.fullName}` }

// formatCurrency() em src/lib/utils.ts usa minimumFractionDigits: 0, o que
// trunca centavos redondos de forma inconsistente (R$ 69,9 em vez de
// R$ 69,90) — preço de produto sempre mostra as duas casas.
function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CATEGORIES = ['shampoo', 'condicionador', 'pomada', 'locao', 'pente'] as const
const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  shampoo: 'Shampoo',
  condicionador: 'Condicionador',
  pomada: 'Pomada',
  locao: 'Loção',
  pente: 'Pente',
}

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams
  const activeCategory = CATEGORIES.includes(categoria as typeof CATEGORIES[number]) ? categoria : undefined

  const db = await createServiceClient()
  let query = db
    .from('products')
    .select('id, slug, name, category, price, compare_at_price, stock_quantity, image_url')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (activeCategory) query = query.eq('category', activeCategory)

  const { data } = await query
  const products = data ?? []

  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[95px]">
      <div className="max-w-[1200px] mx-auto">
        <div className="section-tag" aria-hidden="true">Produtos</div>
        <h1 className="font-display font-normal text-3xl md:text-4xl tracking-[0.1em] uppercase text-offwhite mb-8">
          Cuidados Para Levar
        </h1>

        <div className="flex flex-wrap gap-2 mb-10" role="list" aria-label="Filtrar por categoria">
          <Link
            href="/produtos"
            className={cn(
              'font-body font-light text-2xs tracking-[0.2em] uppercase px-4 py-[9px] border transition-colors',
              !activeCategory ? 'border-gold/40 bg-gold/10 text-gold' : 'border-offwhite/[0.14] text-offwhite/45 hover:border-offwhite/30'
            )}
          >
            Todos
          </Link>
          {CATEGORIES.map(c => (
            <Link
              key={c}
              href={`/produtos?categoria=${c}`}
              className={cn(
                'font-body font-light text-2xs tracking-[0.2em] uppercase px-4 py-[9px] border transition-colors',
                activeCategory === c ? 'border-gold/40 bg-gold/10 text-gold' : 'border-offwhite/[0.14] text-offwhite/45 hover:border-offwhite/30'
              )}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="font-body font-light text-sm text-offwhite/35 italic text-center py-16">
            Nenhum produto disponível nessa categoria no momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => {
              const lowStock = p.stock_quantity > 0 && p.stock_quantity <= 3
              const outOfStock = p.stock_quantity === 0
              return (
                <Link
                  key={p.id}
                  href={`/produtos/${p.slug}`}
                  className="group block border border-offwhite/[0.08] hover:border-gold/30 transition-colors duration-300"
                >
                  <div className="relative aspect-[3/4] bg-offwhite/[0.03] overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display font-light text-sm text-offwhite/15">{CATEGORY_LABELS[p.category as typeof CATEGORIES[number]]}</span>
                      </div>
                    )}
                    {(lowStock || outOfStock) && (
                      <span className={cn(
                        'absolute top-2 left-2 font-body font-light text-[9px] tracking-[0.15em] uppercase px-[8px] py-[4px]',
                        outOfStock ? 'bg-error/85 text-offwhite' : 'bg-charcoal-deep/85 text-gold'
                      )}>
                        {outOfStock ? 'Esgotado' : 'Últimas unidades'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/30 mb-1">
                      {CATEGORY_LABELS[p.category as typeof CATEGORIES[number]]}
                    </p>
                    <h3 className="font-display font-normal text-base tracking-[0.03em] text-offwhite leading-tight mb-2 truncate">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      {p.compare_at_price && (
                        <span className="font-data italic text-xs text-offwhite/25 line-through">{fmt(p.compare_at_price)}</span>
                      )}
                      <span className="font-data italic text-base text-gold">{fmt(p.price)}</span>
                    </div>
                    <AddToCartButton
                      product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.image_url, stockQuantity: p.stock_quantity }}
                      className="[&>button]:py-[9px] [&>button]:text-[8px]"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
