import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { BRAND } from '@/config/brand'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

export const dynamic = 'force-dynamic'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CATEGORY_LABELS: Record<string, string> = {
  shampoo: 'Shampoo',
  condicionador: 'Condicionador',
  pomada: 'Pomada',
  locao: 'Loção',
  pente: 'Pente',
}

async function getProduct(slug: string) {
  const db = await createServiceClient()
  const { data } = await db
    .from('products')
    .select('id, slug, name, category, description, price, compare_at_price, stock_quantity, image_url')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: `Produto — ${BRAND.fullName}` }
  return { title: `${product.name} — ${BRAND.fullName}` }
}

export default async function ProdutoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 3
  const outOfStock = product.stock_quantity === 0
  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.category

  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[152px]">
      <div className="max-w-[960px] mx-auto">
        <p className="font-body font-light text-2xs tracking-[0.2em] uppercase text-offwhite/25 mb-8">
          <Link href="/produtos" className="hover:text-offwhite/50 transition-colors">Produtos</Link>
          <span className="mx-2">/</span>
          {product.name}
        </p>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div className="relative aspect-[3/4] bg-offwhite/[0.03] overflow-hidden">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display font-light text-lg text-offwhite/15">{categoryLabel}</span>
              </div>
            )}
            {(lowStock || outOfStock) && (
              <span className={`absolute top-3 left-3 font-body font-light text-[9px] tracking-[0.15em] uppercase px-[9px] py-[5px] ${outOfStock ? 'bg-error/85 text-offwhite' : 'bg-charcoal-deep/85 text-gold'}`}>
                {outOfStock ? 'Esgotado' : 'Últimas unidades'}
              </span>
            )}
          </div>

          <div>
            <p className="font-body font-light text-2xs tracking-[0.2em] uppercase text-offwhite/30 mb-2">
              {categoryLabel}
            </p>
            <h1 className="font-display font-normal text-3xl tracking-[0.03em] text-offwhite leading-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              {product.compare_at_price && (
                <span className="font-data italic text-base text-offwhite/25 line-through">{fmt(product.compare_at_price)}</span>
              )}
              <span className="font-data italic text-2xl text-gold">{fmt(product.price)}</span>
            </div>

            {product.description && (
              <p className="font-body font-light text-sm leading-[1.75] text-offwhite/55 max-w-[420px] mb-8">
                {product.description}
              </p>
            )}

            <AddToCartButton
              product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.image_url, stockQuantity: product.stock_quantity }}
              showQuantity
              className="max-w-[360px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
