'use client'

import { useState, useTransition } from 'react'
import { createExpense } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

const CATEGORY_SUGGESTIONS = ['Aluguel', 'Produtos', 'Contas', 'Marketing', 'Equipamentos', 'Equipe', 'Outros']

export function ExpenseForm() {
  const { t } = useTranslation()
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)
  const [isFixed,  setIsFixed]      = useState(false)
  const [paidNow,  setPaidNow]      = useState(true)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    if (isFixed) fd.set('is_fixed', 'on')
    if (paidNow) fd.set('paid_now', 'on')
    startTransition(async () => {
      const res = await createExpense(fd)
      if (res?.error) setFeedback(res.error)
      else {
        setSuccess(true)
        ;(e.target as HTMLFormElement).reset()
        setIsFixed(false)
        setPaidNow(true)
      }
    })
  }

  const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55'
  const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
        {t.finance.form.title}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>{t.finance.form.description}</label>
          <input type="text" name="description" required placeholder={t.finance.form.descriptionPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.finance.form.category}</label>
          <input type="text" name="category" required list="expense-categories" placeholder={t.finance.form.categoryPlaceholder} className={inputCls} />
          <datalist id="expense-categories">
            {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>{t.finance.form.amount}</label>
          <input type="number" name="amount" required min="0.01" step="0.01" placeholder={t.finance.form.amountPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.finance.form.dueDate}</label>
          <input type="date" name="due_date" required className={inputCls} />
        </div>
        <div className="flex items-end gap-4 col-span-2 sm:col-span-1">
          <label className="flex items-center gap-2 font-body font-light text-[10px] text-offwhite/55 cursor-pointer">
            <input type="checkbox" checked={isFixed} onChange={e => setIsFixed(e.target.checked)} className="accent-gold" />
            {t.finance.form.fixed}
          </label>
          <label className="flex items-center gap-2 font-body font-light text-[10px] text-offwhite/55 cursor-pointer">
            <input type="checkbox" checked={paidNow} onChange={e => setPaidNow(e.target.checked)} className="accent-gold" />
            {t.finance.form.alreadyPaid}
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
            {pending ? t.finance.form.saving : t.finance.form.submit}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">{t.finance.form.registered}</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}
