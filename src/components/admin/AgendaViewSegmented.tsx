'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export type AgendaView = 'day' | 'workweek' | 'week' | 'month'

export function AgendaViewSegmented({ view, dateStr }: { view: AgendaView; dateStr: string }) {
  const { t } = useTranslation()
  const VIEWS: { key: AgendaView; label: string }[] = [
    { key: 'day',      label: t.agenda.views.day },
    { key: 'workweek', label: t.agenda.views.workweek },
    { key: 'week',     label: t.agenda.views.week },
    { key: 'month',    label: t.agenda.views.month },
  ]
  return (
    <div className="shrink-0 flex items-center border border-offwhite/[0.14] h-[36px] p-[2px]">
      {VIEWS.map(v => (
        <Link
          key={v.key}
          href={`/admin/agenda?view=${v.key}&date=${dateStr}`}
          className={cn(
            'flex items-center justify-center h-full px-3 font-body font-light text-[8.5px] tracking-[0.18em] uppercase whitespace-nowrap transition-all duration-150',
            v.key === view
              ? 'bg-gold text-charcoal-deep'
              : 'text-offwhite/50 hover:text-offwhite'
          )}
        >
          {v.label}
        </Link>
      ))}
    </div>
  )
}
