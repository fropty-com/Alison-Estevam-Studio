'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createShippingRate } from '@/app/admin/actions'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'

export function AddShippingRateForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createShippingRate(fd)
      if (res?.error) setFeedback(res.error)
      else { (e.target as HTMLFormElement).reset(); router.refresh() }
    })
  }

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
        {t.products.shipping.addNew}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div className="col-span-2">
          <label className={labelCls}>{t.products.shipping.label}</label>
          <input type="text" name="label" placeholder={t.products.shipping.labelPlaceholder} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>{t.products.shipping.state}</label>
          <input type="text" name="state" placeholder={t.products.shipping.statePlaceholder} maxLength={2} className={`${inputCls} uppercase`} />
        </div>
        <div>
          <label className={labelCls}>{t.products.shipping.price}</label>
          <input type="number" name="price" step="0.01" min="0" className={inputCls} required />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30"
          >
            {pending ? t.products.shipping.creating : t.products.shipping.submit}
          </button>
        </div>
      </form>
      {feedback && <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70 mt-3">{feedback}</p>}
    </div>
  )
}
