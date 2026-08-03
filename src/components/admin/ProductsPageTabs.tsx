'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function ProductsPageTabs({ productsSlot, shippingSlot, ordersSlot }: { productsSlot: React.ReactNode; shippingSlot: React.ReactNode; ordersSlot: React.ReactNode }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'produtos' | 'frete' | 'pedidos'>('produtos')

  const TAB_LABEL = { produtos: t.products.tabs.products, frete: t.products.tabs.shipping, pedidos: t.products.tabs.orders }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['produtos', 'frete', 'pedidos'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'px-4 py-[9px] font-body font-light text-[9px] tracking-[0.2em] uppercase transition-all duration-150',
              tab === tabKey
                ? 'bg-gold/15 border border-gold/30 text-gold'
                : 'border border-offwhite/[0.14] text-offwhite/45 hover:border-offwhite/30'
            )}
          >
            {TAB_LABEL[tabKey]}
          </button>
        ))}
      </div>

      <div className={cn(tab !== 'produtos' && 'hidden')}>{productsSlot}</div>
      <div className={cn(tab !== 'frete' && 'hidden')}>{shippingSlot}</div>
      <div className={cn(tab !== 'pedidos' && 'hidden')}>{ordersSlot}</div>
    </div>
  )
}
