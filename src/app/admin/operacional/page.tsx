import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { PeakHoursHeatmap } from '@/components/admin/PeakHoursHeatmap'
import { cn } from '@/lib/utils'
import { nowAnchorInSaoPaulo } from '@/lib/timezone'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'

export const dynamic = 'force-dynamic'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

function CancelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6.3" y1="6.3" x2="11.7" y2="11.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11.7" y1="6.3" x2="6.3" y2="11.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function ChannelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="9" cy="9.5" r="2.6" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5.5" y1="6.7" x2="6.3" y2="6.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function MarginIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <line x1="9" y1="2.5" x2="9" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3 5.5c-.5.7-1.3 2-1.3 3.2 0 1.2 1 2 2.2 2s2.2-.8 2.2-2c0-1.2-.8-2.5-1.3-3.2-.3-.4-1.5-.4-1.8 0Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12.9 5.5c-.5.7-1.3 2-1.3 3.2 0 1.2 1 2 2.2 2s2.2-.8 2.2-2c0-1.2-.8-2.5-1.3-3.2-.3-.4-1.5-.4-1.8 0Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}

function fmtPct(value: number) {
  return `${value.toFixed(0)}%`
}

export default async function OperacionalPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)
  const dateLocale = DATE_FNS_LOCALE[locale]

  const now = nowAnchorInSaoPaulo()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const monthStartISO = `${monthStart}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`

  const [apptRes, payRes, expRes] = await Promise.all([
    db.from('appointments')
      .select('status, source, time_slots!inner(date, start_time)')
      .gte('time_slots.date', monthStart)
      .lte('time_slots.date', monthEnd),

    db.from('payments')
      .select('gross_amount, appointments(discount)')
      .gte('paid_at', monthStartISO)
      .lt('paid_at', nextMonthISO)
      .is('refunded_at', null),

    db.from('expenses')
      .select('amount, due_date')
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd),
  ])

  const appts = apptRes.data ?? []
  const payments = payRes.data ?? []
  const expenses = expRes.data ?? []

  // ── Taxa de cancelamento ──
  const totalMonth = appts.length
  const cancelledMonth = appts.filter(a => a.status === 'cancelled').length
  const cancelRate = totalMonth > 0 ? (cancelledMonth / totalMonth) * 100 : 0

  // ── Online vs Presencial ──
  const activeAppts = appts.filter(a => a.status !== 'cancelled' && a.status !== 'no_show')
  const onlineCount = activeAppts.filter(a => a.source === 'online').length
  const presencialCount = activeAppts.filter(a => a.source === 'presencial').length
  const onlinePct = activeAppts.length > 0 ? (onlineCount / activeAppts.length) * 100 : 0

  // ── Margem operacional ──
  const grossThis = payments.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const discountsThis = payments.reduce((sum, p) => {
    const appt = Array.isArray(p.appointments) ? p.appointments[0] : p.appointments
    return sum + Number(appt?.discount ?? 0)
  }, 0)
  const receitaLiquida = grossThis - discountsThis
  const despesasThis = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
  const resultado = receitaLiquida - despesasThis
  const margemOperacional = receitaLiquida > 0 ? (resultado / receitaLiquida) * 100 : 0

  // ── Horários de pico ──
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 07h..20h
  const heatCounts: Record<string, number> = {}
  for (const a of activeAppts) {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    if (!slot?.date || !slot?.start_time) continue
    const weekday = new Date(`${slot.date}T00:00:00`).getDay()
    if (weekday === 0) continue
    const hour = Number(slot.start_time.slice(0, 2))
    const key = `${weekday}-${hour}`
    heatCounts[key] = (heatCounts[key] ?? 0) + 1
  }
  const heatCells = Object.entries(heatCounts).map(([key, count]) => {
    const [weekday, hour] = key.split('-').map(Number)
    return { weekday, hour, count }
  })

  const monthLabel = format(now, locale === 'pt' ? "MMMM 'de' yyyy" : 'MMMM yyyy', { locale: dateLocale })

  return (
    <div className="px-6 py-8 space-y-8">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">{t.operational.eyebrow}</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.operational.title}</h1>
        <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.15em] mt-1 capitalize">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 flex items-start gap-4">
          <span className="w-[40px] h-[40px] rounded-full bg-error/15 text-error/80 flex items-center justify-center shrink-0">
            <CancelIcon />
          </span>
          <div>
            <p className="font-body font-light text-[9px] tracking-[0.14em] uppercase text-offwhite/40 mb-2">{t.operational.cancelRate.title}</p>
            <p className={cn('font-data text-[22px] leading-none mb-1', cancelRate > 20 ? 'text-error/75' : 'text-offwhite')}>{fmtPct(cancelRate)}</p>
            <p className="font-body font-light text-[9px] text-offwhite/25">{t.operational.cancelRate.sub(cancelledMonth, totalMonth)}</p>
          </div>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 flex items-start gap-4">
          <span className="w-[40px] h-[40px] rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
            <ChannelIcon />
          </span>
          <div>
            <p className="font-body font-light text-[9px] tracking-[0.14em] uppercase text-offwhite/40 mb-2">{t.operational.channel.title}</p>
            <p className="font-data text-[22px] text-gold leading-none mb-1">{t.operational.channel.onlinePct(fmtPct(onlinePct))}</p>
            <p className="font-body font-light text-[9px] text-offwhite/25">{t.operational.channel.sub(onlineCount, presencialCount)}</p>
          </div>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 flex items-start gap-4">
          <span className="w-[40px] h-[40px] rounded-full bg-sage/15 text-sage-light flex items-center justify-center shrink-0">
            <MarginIcon />
          </span>
          <div>
            <p className="font-body font-light text-[9px] tracking-[0.14em] uppercase text-offwhite/40 mb-2">{t.operational.margin.title}</p>
            <p className={cn('font-data text-[22px] leading-none mb-1', margemOperacional >= 0 ? 'text-sage-light' : 'text-error/75')}>{fmtPct(margemOperacional)}</p>
            <p className="font-body font-light text-[9px] text-offwhite/25">{t.operational.margin.sub}</p>
          </div>
        </div>
      </div>

      <PeakHoursHeatmap cells={heatCells} hours={HOURS} />
    </div>
  )
}
