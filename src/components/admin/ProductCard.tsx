'use client'

import { useTransition } from 'react'
import { toggleProductActive } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import type { ProductFormValues } from './ProductFormModal'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export type Product = ProductFormValues & { active: boolean }

export function ProductCard({ product, onEdit }: { product: Product; onEdit: (p: Product) => void }) {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()

  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 3
  const outOfStock = product.stock_quantity === 0

  return (
    <div className={cn('bg-offwhite/5 border border-offwhite/[0.07] transition-all duration-200', !product.active && 'opacity-45')}>
      <div className="relative w-full aspect-[3/4] bg-offwhite/[0.03] overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display font-light text-[13px] text-offwhite/55">{t.products.categories[product.category as keyof typeof t.products.categories]}</span>
          </div>
        )}
        {(lowStock || outOfStock) && (
          <span className={cn(
            'absolute top-2 left-2 font-body font-light text-[7.5px] tracking-[0.15em] uppercase px-[7px] py-[3px]',
            outOfStock ? 'bg-error/85 text-offwhite' : 'bg-charcoal-deep/85 text-gold'
          )}>
            {outOfStock ? t.products.card.outOfStock : t.products.card.lowStock}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="font-body font-light text-[8px] tracking-[0.2em] uppercase text-offwhite/55 mb-1">
          {t.products.categories[product.category as keyof typeof t.products.categories]}
        </p>
        <p className="font-display font-light text-[15px] text-offwhite leading-tight mb-2 truncate">{product.name}</p>

        <div className="flex items-center gap-2 mb-3">
          {product.compare_at_price && (
            <span className="font-data italic text-[11px] text-offwhite/55 line-through">{fmt(product.compare_at_price)}</span>
          )}
          <span className="font-data italic text-[15px] text-gold">{fmt(product.price)}</span>
        </div>

        <p className="font-body font-light text-[8.5px] text-offwhite/55 tracking-[0.1em] mb-3">
          {t.products.card.stock(product.stock_quantity)}
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await toggleProductActive(product.id, !product.active) })}
            className={cn(
              'w-[34px] h-[20px] rounded-full border transition-all duration-300 relative shrink-0 disabled:opacity-40',
              product.active ? 'bg-sage/25 border-sage/40' : 'bg-offwhite/5 border-offwhite/15'
            )}
            aria-label={product.active ? t.products.card.deactivate : t.products.card.activate}
          >
            <span className={cn(
              'absolute top-[3px] w-[12px] h-[12px] rounded-full transition-all duration-300',
              product.active ? 'left-[18px] bg-sage' : 'left-[3px] bg-offwhite/25'
            )} />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex-1 font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/55 hover:text-offwhite/85 transition-colors px-2 py-1 border border-transparent hover:border-offwhite/[0.12]"
          >
            {t.products.card.edit}
          </button>
        </div>
      </div>
    </div>
  )
}
