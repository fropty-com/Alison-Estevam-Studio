'use client'

import { useState, useTransition } from 'react'
import { addBlockedPeriod } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function BlockedPeriodForm() {
  const { t } = useTranslation()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addBlockedPeriod(fd)
      if (res?.error) setFeedback(res.error)
      else { setSuccess(true); (e.target as HTMLFormElement).reset() }
    })
  }

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
        {t.settings.blocked.formTitle}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]">
            {t.settings.blocked.dateStart}
          </label>
          <input
            type="date"
            name="date_start"
            required
            min={today}
            className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]">
            {t.settings.blocked.dateEnd}
          </label>
          <input
            type="date"
            name="date_end"
            required
            min={today}
            className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]">
            {t.settings.blocked.reasonOptional}
          </label>
          <input
            type="text"
            name="reason"
            placeholder={t.settings.blocked.reasonPlaceholder}
            className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55"
          />
        </div>
        <div className="sm:col-span-3 flex items-center gap-3">
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
            {pending ? t.settings.blocked.submitting : t.settings.blocked.submit}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">{t.settings.blocked.success}</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}
