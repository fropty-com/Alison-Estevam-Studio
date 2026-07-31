'use client'

import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function RestrictedAccess() {
  const { t } = useTranslation()
  return (
    <div className="p-8">
      <div className="max-w-[420px] mx-auto mt-[80px] text-center bg-offwhite/5 border border-offwhite/[0.07] p-10">
        <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-4">
          {t.common.restrictedAccess.eyebrow}
        </p>
        <p className="font-display font-light text-[20px] text-offwhite/70 leading-[1.4] mb-3">
          {t.common.restrictedAccess.title}
        </p>
        <p className="font-body font-light text-[12px] text-offwhite/35 leading-[1.6]">
          {t.common.restrictedAccess.body}
        </p>
      </div>
    </div>
  )
}
