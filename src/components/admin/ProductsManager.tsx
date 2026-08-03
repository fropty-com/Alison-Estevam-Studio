'use client'

import { useState } from 'react'
import { ProductCard, type Product } from './ProductCard'
import { ProductFormModal } from './ProductFormModal'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function ProductsManager({ products }: { products: Product[] }) {
  const { t } = useTranslation()
  const [modal, setModal] = useState<'closed' | 'new' | Product>('closed')

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40">
          {t.products.manage.title}
        </h2>
        <button
          onClick={() => setModal('new')}
          className="px-4 py-[9px] font-body font-medium text-[8px] tracking-[0.28em] uppercase bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-all duration-200"
        >
          {t.products.manage.addNew}
        </button>
      </div>

      {products.length === 0 ? (
        <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">
          {t.products.manage.empty}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onEdit={setModal} />
          ))}
        </div>
      )}

      {modal !== 'closed' && (
        <ProductFormModal
          product={modal === 'new' ? undefined : modal}
          onClose={() => setModal('closed')}
        />
      )}
    </section>
  )
}
