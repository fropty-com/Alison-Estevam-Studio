import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { WaitlistEntryRow } from '@/components/admin/WaitlistEntryRow'
import { AddWaitlistButton } from '@/components/admin/AddWaitlistButton'
import { buildWaitlistNotifyUrl } from '@/lib/whatsapp/messages'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'
import type { Dictionary } from '@/lib/i18n/dictionaries/pt'
import type { Locale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

function dayLabel(dateStr: string, locale: Locale, t: Dictionary) {
  const d = parseISO(dateStr)
  if (isToday(d)) return t.waitlist.today
  if (isTomorrow(d)) return t.waitlist.tomorrow
  return format(d, locale === 'pt' ? "EEEE, d 'de' MMMM" : 'EEEE, MMMM d', { locale: DATE_FNS_LOCALE[locale] })
}

export default async function EsperaPage() {
  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)

  const { data: raw } = await db
    .from('waitlist_entries')
    .select('id, preferred_date, note, status, clients(name, whatsapp), services(name)')
    .in('status', ['waiting', 'notified'])
    .order('preferred_date', { ascending: true })
    .order('created_at', { ascending: true })

  const entries = raw ?? []

  const groups: { day: string; items: typeof entries }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.day === entry.preferred_date) last.items.push(entry)
    else groups.push({ day: entry.preferred_date, items: [entry] })
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">{t.waitlist.eyebrow}</p>
          <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.waitlist.title}</h1>
          <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.1em] mt-1">
            {t.waitlist.subtitle(entries.length)}
          </p>
        </div>
        <AddWaitlistButton />
      </div>

      {groups.length === 0 ? (
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-10 text-center">
          <p className="font-display font-light text-[20px] text-offwhite/[0.18] italic">
            {t.waitlist.empty}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ day, items }) => (
            <div key={day}>
              <p className="font-body font-light text-[8px] tracking-[0.32em] uppercase text-offwhite/30 mb-3">
                {dayLabel(day, locale, t)}
              </p>
              <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
                {items.map(entry => (
                  <WaitlistEntryRow
                    key={entry.id}
                    id={entry.id}
                    clientName={entry.clients?.name ?? '—'}
                    clientWhatsapp={entry.clients?.whatsapp ?? ''}
                    serviceName={entry.services?.name ?? '—'}
                    note={entry.note}
                    status={entry.status as 'waiting' | 'notified'}
                    notifyUrl={buildWaitlistNotifyUrl({
                      clientName: entry.clients?.name ?? '',
                      clientWhatsapp: entry.clients?.whatsapp ?? '',
                      serviceName: entry.services?.name ?? '',
                      date: entry.preferred_date,
                    })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
