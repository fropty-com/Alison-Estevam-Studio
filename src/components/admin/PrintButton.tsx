'use client'

import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function PrintButton() {
  const { t } = useTranslation()
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep hover:bg-gold-light transition-all duration-300"
    >
      {t.reports.print.printButton}
    </button>
  )
}
