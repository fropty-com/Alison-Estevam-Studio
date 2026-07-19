'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { addBlockedPeriod, removeBlockedPeriod } from '@/app/admin/actions'

export function DayOffToggleButton({
  date,
  blocked,
  blockedPeriodId,
  appointmentCount,
}: {
  date: string
  blocked: boolean
  blockedPeriodId: string | null
  appointmentCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!blocked && appointmentCount > 0) {
      const ok = window.confirm(
        `Há ${appointmentCount} agendamento(s) nesse dia. Eles não serão cancelados, mas o dia ficará marcado como folga. Continuar?`
      )
      if (!ok) return
    }

    startTransition(async () => {
      if (blocked && blockedPeriodId) {
        await removeBlockedPeriod(blockedPeriodId)
      } else {
        const fd = new FormData()
        fd.set('date_start', date)
        fd.set('date_end', date)
        await addBlockedPeriod(fd)
      }
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={cn(
        'shrink-0 whitespace-nowrap px-4 h-[36px] border font-body font-light text-[8px] tracking-[0.28em] uppercase transition-all duration-200 disabled:opacity-40',
        blocked
          ? 'border-error/35 text-error/70 hover:bg-error/10 hover:border-error/55'
          : 'border-offwhite/18 text-offwhite/45 hover:border-offwhite/40 hover:text-offwhite'
      )}
    >
      {pending ? 'Salvando…' : blocked ? 'Remover folga' : 'Marcar folga'}
    </button>
  )
}
