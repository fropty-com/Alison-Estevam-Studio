'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markExpensePaid, deleteExpense } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export interface ExpenseRow {
  id: string
  description: string
  category: string
  amount: number
  isFixed: boolean
  dueDate: string
  paidDate: string | null
  dueLabel: string
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ExpenseList({ expenses }: { expenses: ExpenseRow[] }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const togglePaid = (id: string, paid: boolean) => {
    startTransition(async () => {
      await markExpensePaid(id, !paid)
      router.refresh()
    })
  }

  const remove = (id: string, description: string) => {
    const ok = window.confirm(t.finance.list.confirmDelete(description))
    if (!ok) return
    startTransition(async () => {
      await deleteExpense(id)
      router.refresh()
    })
  }

  if (expenses.length === 0) {
    return (
      <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">
        {t.finance.list.none}
      </p>
    )
  }

  return (
    <div className="divide-y divide-offwhite/6 -mx-6">
      {expenses.map(e => {
        const paid = !!e.paidDate
        const overdue = !paid && e.dueDate < new Date().toISOString().slice(0, 10)
        return (
          <div key={e.id} className="flex items-center gap-4 px-6 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-body font-light text-[12px] text-offwhite/75 truncate">{e.description}</p>
              <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.1em]">
                {e.category} · {e.isFixed ? t.finance.list.fixed : t.finance.list.variable} · {t.finance.list.dueLabel(e.dueLabel)}
              </p>
            </div>
            <span className="font-data text-[13px] text-offwhite/65 shrink-0">{fmt(e.amount)}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => togglePaid(e.id, paid)}
              className={cn(
                'shrink-0 px-3 py-[5px] font-body font-light text-[8px] tracking-[0.18em] uppercase border transition-all duration-150 disabled:opacity-40',
                paid
                  ? 'border-sage/30 bg-sage/15 text-sage-light hover:bg-sage/25'
                  : overdue
                    ? 'border-error/40 text-error/70 hover:bg-error/10'
                    : 'border-offwhite/[0.14] text-offwhite/55 hover:border-offwhite/30'
              )}
            >
              {paid ? t.finance.list.paid : overdue ? t.finance.list.overdue : t.finance.list.markPaid}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(e.id, e.description)}
              aria-label={t.finance.list.deleteLabel}
              className="shrink-0 text-offwhite/55 hover:text-error/70 transition-colors text-[13px] disabled:opacity-40"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
