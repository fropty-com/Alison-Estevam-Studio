'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function ProductsPageTabs({ productsSlot, shippingSlot }: { productsSlot: React.ReactNode; shippingSlot: React.ReactNode }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'produtos' | 'frete'>('produtos')

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['produtos', 'frete'] as const).map(tabKey => (
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
            {tabKey === 'produtos' ? t.products.tabs.products : t.products.tabs.shipping}
          </button>
        ))}
      </div>

      <div className={cn(tab !== 'produtos' && 'hidden')}>{productsSlot}</div>
      <div className={cn(tab !== 'frete' && 'hidden')}>{shippingSlot}</div>
    </div>
  )
}
