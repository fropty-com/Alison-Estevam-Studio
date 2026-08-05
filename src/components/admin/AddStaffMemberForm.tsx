'use client'

import { useState, useTransition } from 'react'
import { addStaffMember } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function AddStaffMemberForm() {
  const { t } = useTranslation()
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)
  const [role,     setRole]         = useState<'staff' | 'owner'>('staff')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set('role', role)
    startTransition(async () => {
      const res = await addStaffMember(fd)
      if (res?.error) setFeedback(res.error)
      else { setSuccess(true); (e.target as HTMLFormElement).reset(); setRole('staff') }
    })
  }

  const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55'
  const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
        {t.settings.staff.formTitle}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t.settings.staff.name}</label>
          <input type="text" name="name" required placeholder={t.settings.staff.namePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.settings.staff.email}</label>
          <input type="email" name="email" required placeholder={t.settings.staff.emailPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.settings.staff.password}</label>
          <input type="password" name="password" required minLength={8} placeholder={t.settings.staff.passwordPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.settings.staff.role}</label>
          <div className="flex gap-[6px]">
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={cn(
                'flex-1 px-3 py-[9px] font-body font-light text-[10px] tracking-[0.12em] border transition-all duration-200',
                role === 'staff' ? 'border-offwhite/40 text-offwhite/80 bg-offwhite/5' : 'border-offwhite/[0.12] text-offwhite/55 hover:border-offwhite/25'
              )}
            >
              {t.settings.staff.staffRole}
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={cn(
                'flex-1 px-3 py-[9px] font-body font-light text-[10px] tracking-[0.12em] border transition-all duration-200',
                role === 'owner' ? 'border-gold bg-gold/15 text-gold' : 'border-offwhite/[0.12] text-offwhite/55 hover:border-offwhite/25'
              )}
            >
              {t.settings.staff.owner}
            </button>
          </div>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
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
            {pending ? t.settings.staff.submitting : t.settings.staff.submit}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">{t.settings.staff.success}</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}
