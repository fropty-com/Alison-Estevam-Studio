'use client'

import { useState, useTransition } from 'react'
import { createService } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function AddServiceForm() {
  const { t } = useTranslation()
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)
  const [hidden,   setHidden]       = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    if (hidden) fd.set('hidden_from_list', 'on')
    startTransition(async () => {
      const res = await createService(fd)
      if (res?.error) setFeedback(res.error)
      else {
        setSuccess(true)
        ;(e.target as HTMLFormElement).reset()
        setHidden(false)
      }
    })
  }

  const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55'
  const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
        {t.services.addForm.title}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>{t.services.addForm.name}</label>
          <input type="text" name="name" required placeholder={t.services.addForm.namePlaceholder} className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={labelCls}>{t.services.addForm.descriptionOptional}</label>
          <input type="text" name="description" placeholder={t.services.addForm.descriptionPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.services.addForm.price}</label>
          <input type="number" name="price" required min="0" step="0.01" placeholder={t.services.addForm.pricePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.services.addForm.duration}</label>
          <input type="number" name="duration" required min="1" step="1" placeholder={t.services.addForm.durationPlaceholder} className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-2 flex items-end">
          <label className="flex items-center gap-2 font-body font-light text-[10px] text-offwhite/55 cursor-pointer">
            <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} className="accent-gold" />
            {t.services.addForm.standaloneCheckbox}
          </label>
        </div>
        <div className="col-span-2 sm:col-span-4 flex items-center gap-3 mt-1">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              'px-6 py-[10px] font-body font-light text-[9px] tracking-[0.35em] uppercase',
              'bg-offwhite/5 border border-offwhite/[0.14] text-offwhite/60',
              'hover:bg-sage/15 hover:border-sage/30 hover:text-sage-light',
              'transition-all duration-200 disabled:opacity-40'
            )}
          >
            {pending ? t.services.addForm.creating : t.services.addForm.submit}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">{t.services.addForm.created}</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}
