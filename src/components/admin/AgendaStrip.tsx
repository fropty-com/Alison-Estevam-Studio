'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  format, addDays, subDays, isSameDay, isToday,
  startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek,
} from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import type { Locale } from '@/lib/i18n/locales'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

interface Chip {
  key: string
  href: string
  top: string
  bottom: string
  active: boolean
  today: boolean
}

function buildDayChips(selectedDate: Date, view: string, locale: Locale): Chip[] {
  const dateLocale = DATE_FNS_LOCALE[locale]
  const chips: Chip[] = []
  for (let offset = -7; offset <= 7; offset++) {
    const d = offset < 0 ? subDays(selectedDate, -offset) : addDays(selectedDate, offset)
    chips.push({
      key: format(d, 'yyyy-MM-dd'),
      href: `/admin/agenda?view=${view}&date=${format(d, 'yyyy-MM-dd')}`,
      top: format(d, 'EEE', { locale: dateLocale }).replace('.', '').toUpperCase(),
      bottom: format(d, 'd'),
      active: isSameDay(d, selectedDate),
      today: isToday(d),
    })
  }
  return chips
}

function buildWeekChips(selectedDate: Date, view: string, locale: Locale): Chip[] {
  const dateLocale = DATE_FNS_LOCALE[locale]
  const chips: Chip[] = []
  for (let offset = -6; offset <= 6; offset++) {
    const base = offset < 0 ? subWeeks(selectedDate, -offset) : addWeeks(selectedDate, offset)
    const start = startOfWeek(base, { weekStartsOn: 1 })
    const end = endOfWeek(base, { weekStartsOn: 1 })
    chips.push({
      key: format(start, 'yyyy-MM-dd'),
      href: `/admin/agenda?view=${view}&date=${format(start, 'yyyy-MM-dd')}`,
      top: format(start, 'MMM', { locale: dateLocale }).replace('.', '').toUpperCase(),
      bottom: `${format(start, 'd')}–${format(end, 'd')}`,
      active: isSameWeek(base, selectedDate, { weekStartsOn: 1 }),
      today: isSameWeek(base, new Date(), { weekStartsOn: 1 }),
    })
  }
  return chips
}

export function AgendaStrip({ selectedDate, view }: { selectedDate: string; view: 'day' | 'workweek' | 'week'; }) {
  const { locale } = useTranslation()
  const dateObj = new Date(`${selectedDate}T00:00:00`)
  const activeRef = useRef<HTMLAnchorElement>(null)

  const chips = view === 'day' ? buildDayChips(dateObj, view, locale) : buildWeekChips(dateObj, view, locale)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' })
  }, [selectedDate, view])

  return (
    <div className="flex gap-[6px] overflow-x-auto pb-1 -mb-1 mb-4">
      {chips.map(c => (
        <Link
          key={c.key}
          ref={c.active ? activeRef : undefined}
          href={c.href}
          className={cn(
            'shrink-0 w-[52px] flex flex-col items-center justify-center gap-[2px] py-[8px] border transition-all duration-150',
            c.active
              ? 'bg-gold border-gold text-charcoal-deep'
              : c.today
                ? 'border-gold/40 text-offwhite/70 hover:border-gold/60'
                : 'border-offwhite/10 text-offwhite/45 hover:border-offwhite/25 hover:text-offwhite/70'
          )}
        >
          <span className="font-body font-light text-[7.5px] tracking-[0.15em]">{c.top}</span>
          <span className="font-data text-[13px] leading-none">{c.bottom}</span>
        </Link>
      ))}
    </div>
  )
}
