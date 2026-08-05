import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { cn } from '@/lib/utils'
import { nowAnchorInSaoPaulo, isTodayInSaoPaulo, isYesterdayInSaoPaulo, todayInSaoPaulo, formatTimeInSaoPaulo } from '@/lib/timezone'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'
import type { Dictionary } from '@/lib/i18n/dictionaries/pt'
import type { Locale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

const CATEGORY_DOT: Record<string, string> = {
  appointment: 'bg-sage/70',
  service: 'bg-gold/80',
  payment_fee: 'bg-gold/80',
  staff: 'bg-error/50',
  blocked_period: 'bg-offwhite/40',
  availability_rule: 'bg-offwhite/40',
  loyalty: 'bg-sage/70',
  coupon: 'bg-sage/70',
  expense: 'bg-error/50',
}

function dayLabel(dateStr: string, locale: Locale, t: Dictionary) {
  const d = parseISO(dateStr)
  if (isTodayInSaoPaulo(d)) return t.activity.today
  if (isYesterdayInSaoPaulo(d)) return t.activity.yesterday
  return format(d, locale === 'pt' ? "d 'de' MMMM" : 'MMMM d', { locale: DATE_FNS_LOCALE[locale] })
}

export default async function AtividadePage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)

  const now = nowAnchorInSaoPaulo()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')

  const [logRes, svcRes] = await Promise.all([
    db.from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),

    db.from('appointments')
      .select('services(name), time_slots!inner(date)')
      .eq('status', 'completed')
      .gte('time_slots.date', monthStart)
      .lte('time_slots.date', monthEnd),
  ])

  const entries = logRes.data ?? []
  const svcAppts = svcRes.data ?? []

  const svcCounts: Record<string, number> = {}
  for (const a of svcAppts) {
    const svc = Array.isArray(a.services) ? a.services[0] : a.services
    if (!svc?.name) continue
    svcCounts[svc.name] = (svcCounts[svc.name] ?? 0) + 1
  }
  const topServices = Object.entries(svcCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  const maxCount = Math.max(...topServices.map(s => s.count), 1)

  // Group by day for readability
  const groups: { day: string; items: typeof entries }[] = []
  for (const entry of entries) {
    const day = todayInSaoPaulo(parseISO(entry.created_at))
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(entry)
    else groups.push({ day, items: [entry] })
  }

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/55 mb-1">{t.activity.eyebrow}</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.activity.title}</h1>
      </div>

      {/* Top serviços do mês */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-display font-light text-[17px] text-offwhite mb-1">{t.activity.topServices.title}</p>
        <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.1em] mb-6">{t.activity.topServices.subtitle}</p>
        {topServices.length === 0 ? (
          <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">
            {t.activity.topServices.empty}
          </p>
        ) : (
          <div className="space-y-[12px]">
            {topServices.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-[5px]">
                  <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                  <span className="font-data text-[13px] text-offwhite/55">{s.count}×</span>
                </div>
                <div className="w-full h-[3px] bg-offwhite/5">
                  <div className="h-full bg-sage/45 transition-all duration-500" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Atividade recente */}
      <div>
        <p className="font-display font-light text-[17px] text-offwhite mb-1">{t.activity.recent.title}</p>
        <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.1em] mb-6">
          {t.activity.recent.subtitle(entries.length)}
        </p>

        {groups.length === 0 ? (
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-10 text-center">
            <p className="font-display font-light text-[20px] text-offwhite/55 italic">
              {t.activity.recent.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(({ day, items }) => (
              <div key={day}>
                <p className="font-body font-light text-[8px] tracking-[0.32em] uppercase text-offwhite/55 mb-3">
                  {dayLabel(day, locale, t)}
                </p>
                <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
                  {items.map(entry => {
                    const category = entry.action.split('.')[0]
                    return (
                      <div key={entry.id} className="flex items-start gap-3 px-5 py-4">
                        <span className={cn('w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]', CATEGORY_DOT[category] ?? 'bg-offwhite/30')} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-light text-[12.5px] text-offwhite/80">
                            {entry.summary}
                          </p>
                          <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.1em] mt-[3px]">
                            {entry.actor_name} · {formatTimeInSaoPaulo(parseISO(entry.created_at))}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
