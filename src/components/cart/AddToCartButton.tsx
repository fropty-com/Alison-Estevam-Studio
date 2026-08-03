'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/CartContext'
import { cn } from '@/lib/utils'

export function AddToCartButton({
  product,
  className,
  showQuantity = false,
}: {
  product: { id: string; slug: string; name: string; price: number; imageUrl: string | null; stockQuantity: number }
  className?: string
  showQuantity?: boolean
}) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const outOfStock = product.stockQuantity === 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
    }, quantity)
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showQuantity && !outOfStock && (
        <div className="flex items-center border border-offwhite/[0.14]">
          <button
            type="button"
            onClick={e => { e.preventDefault(); setQuantity(q => Math.max(1, q - 1)) }}
            disabled={quantity <= 1}
            className="w-[32px] h-[32px] flex items-center justify-center text-offwhite/50 hover:text-offwhite disabled:opacity-30 transition-colors"
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="w-[32px] text-center font-body font-light text-[12px] text-offwhite">{quantity}</span>
          <button
            type="button"
            onClick={e => { e.preventDefault(); setQuantity(q => Math.min(product.stockQuantity, q + 1)) }}
            disabled={quantity >= product.stockQuantity}
            className="w-[32px] h-[32px] flex items-center justify-center text-offwhite/50 hover:text-offwhite disabled:opacity-30 transition-colors"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex-1 px-6 py-[12px] font-body font-medium text-[10px] tracking-[0.28em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {outOfStock ? 'Esgotado' : 'Adicionar ao carrinho'}
      </button>
    </div>
  )
}
