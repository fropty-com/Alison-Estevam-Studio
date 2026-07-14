import { createServiceClient } from '@/lib/supabase/server'
import {
  format, addDays, subDays, parseISO,
  startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { DayGrid, type GridAppointment } from '@/components/admin/DayGrid'
import { NewAppointmentButton } from '@/components/admin/NewAppointmentButton'
import { timeToMinutes } from '@/lib/schedule/dayGridLayout'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_DOT: Record<string, string> = {
  pending:     'bg-warning/70',
  confirmed:   'bg-sage/70',
  checked_in:  'bg-gold/80',
  in_progress: 'bg-gold/80',
  completed:   'bg-offwhite/25',
  cancelled:   'bg-error/40',
  no_show:     'bg-error/30',
}

type View = 'day' | 'week' | 'month'

function ViewSwitcher({ view, dateStr }: { view: View; dateStr: string }) {
  const tabs: { key: View; label: string }[] = [
    { key: 'day',   label: 'Dia' },
    { key: 'week',  label: 'Semana' },
    { key: 'month', label: 'Mês' },
  ]
  return (
    <div className="flex border border-offwhite/10">
      {tabs.map(t => (
        <Link
          key={t.key}
          href={`/admin/agenda?view=${t.key}&date=${dateStr}`}
          className={cn(
            'px-4 h-9 flex items-center font-body font-light text-[8px] tracking-[0.28em] uppercase transition-all duration-200',
            view === t.key
              ? 'bg-sage/12 text-sage-light'
              : 'text-offwhite/35 hover:text-offwhite/60'
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

function NavArrows({ prevHref, todayHref, nextHref }: { prevHref: string; todayHref: string; nextHref: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={prevHref} className="w-9 h-9 border border-offwhite/10 text-offwhite/30 text-[13px] flex items-center justify-center hover:border-sage/40 hover:text-sage-light transition-all duration-200">
        ‹
      </Link>
      <Link href={todayHref} className="px-4 h-9 border border-offwhite/10 font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/35 flex items-center hover:border-sage/40 hover:text-sage-light transition-all duration-200">
        Hoje
      </Link>
      <Link href={nextHref} className="w-9 h-9 border border-offwhite/10 text-offwhite/30 text-[13px] flex items-center justify-center hover:border-sage/40 hover:text-sage-light transition-all duration-200">
        ›
      </Link>
    </div>
  )
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { view?: string; date?: string }
}) {
  const view: View = searchParams.view === 'week' || searchParams.view === 'month' ? searchParams.view : 'day'
  const dateStr = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')
  const dateObj = parseISO(dateStr)
  const db = await createServiceClient() as any

  // ── Day view — hour-ruler grid with proportional blocks ──
  if (view === 'day') {
    const prev  = format(subDays(dateObj, 1), 'yyyy-MM-dd')
    const next  = format(addDays(dateObj, 1), 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    const label = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR })
    const weekday = dateObj.getDay()

    const [apptsRes, rulesRes, blockedRes] = await Promise.all([
      db.from('appointments')
        .select('id, reference_code, status, notes, total_price, checked_in_at, services(name, price, duration), clients(id, name, whatsapp, vip), time_slots!inner(date, start_time, end_time)')
        .eq('time_slots.date', dateStr)
        .order('time_slots(start_time)', { ascending: true }),
      db.from('availability_rules').select('start_time, end_time').eq('weekday', weekday).eq('active', true),
      db.from('blocked_periods').select('id').lte('date_start', dateStr).gte('date_end', dateStr),
    ])

    const appts  = (apptsRes.data  ?? []) as any[]
    const rules  = (rulesRes.data  ?? []) as { start_time: string; end_time: string }[]
    const blockedAllDay = ((blockedRes.data ?? []) as any[]).length > 0

    // Grid spans the earliest rule start to the latest rule end for the day,
    // falling back to a sensible default when there's no rule (e.g. a
    // day normally closed, but with a one-off appointment on it anyway).
    const ruleStarts = rules.map(r => timeToMinutes(r.start_time))
    const ruleEnds   = rules.map(r => timeToMinutes(r.end_time))
    const gridStartMin = ruleStarts.length ? Math.min(...ruleStarts) : timeToMinutes('07:00')
    const gridEndMin   = ruleEnds.length   ? Math.max(...ruleEnds)   : timeToMinutes('20:00')

    const gridAppointments: GridAppointment[] = appts.map((a: any) => {
      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
      const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
      const cli  = Array.isArray(a.clients)    ? a.clients[0]    : a.clients
      const startMin = timeToMinutes((slot?.start_time as string)?.substring(0, 5) ?? '00:00')
      const endMin   = timeToMinutes((slot?.end_time   as string)?.substring(0, 5) ?? '00:00')
      return {
        id: a.id,
        referenceCode: a.reference_code,
        status: a.status,
        notes: a.notes,
        totalPrice: Number(a.total_price),
        startMin,
        endMin,
        timeLabel: (slot?.start_time as string)?.substring(0, 5) ?? '--',
        durationLabel: svc?.duration ? `${svc.duration}min` : '',
        clientName: cli?.name ?? '—',
        clientWhatsapp: cli?.whatsapp ?? '',
        clientVip: !!cli?.vip,
        serviceName: svc?.name ?? '—',
        servicePrice: svc?.price ?? null,
        checkedInAt: a.checked_in_at ? format(new Date(a.checked_in_at), 'HH:mm') : null,
      }
    })

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
            <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
              {label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NewAppointmentButton />
            <ViewSwitcher view={view} dateStr={dateStr} />
            <NavArrows
              prevHref={`/admin/agenda?view=day&date=${prev}`}
              todayHref={`/admin/agenda?view=day&date=${today}`}
              nextHref={`/admin/agenda?view=day&date=${next}`}
            />
          </div>
        </div>

        <DayGrid
          gridStartMin={gridStartMin}
          gridEndMin={gridEndMin}
          blockedAllDay={blockedAllDay}
          appointments={gridAppointments}
          prevHref={`/admin/agenda?view=day&date=${prev}`}
          nextHref={`/admin/agenda?view=day&date=${next}`}
        />
      </div>
    )
  }

  // ── Week view — 7-day overview, chips link into the day view ──
  if (view === 'week') {
    const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 })
    const weekEnd   = endOfWeek(dateObj,   { weekStartsOn: 1 })
    const days      = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const today     = format(new Date(), 'yyyy-MM-dd')
    const prev      = format(subWeeks(dateObj, 1), 'yyyy-MM-dd')
    const next      = format(addWeeks(dateObj, 1), 'yyyy-MM-dd')
    const label     = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`

    const { data: raw } = await db
      .from('appointments')
      .select('id, status, total_price, services(name), clients(name), time_slots!inner(date, start_time)')
      .gte('time_slots.date', format(weekStart, 'yyyy-MM-dd'))
      .lte('time_slots.date', format(weekEnd, 'yyyy-MM-dd'))
      .order('time_slots(start_time)', { ascending: true })

    const appts = (raw ?? []) as any[]
    const byDate: Record<string, any[]> = {}
    for (const a of appts) {
      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
      const d = slot?.date
      if (!d) continue
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(a)
    }

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
            <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
              {label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ViewSwitcher view={view} dateStr={dateStr} />
            <NavArrows
              prevHref={`/admin/agenda?view=week&date=${prev}`}
              todayHref={`/admin/agenda?view=week&date=${today}`}
              nextHref={`/admin/agenda?view=week&date=${next}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-[1px] bg-offwhite/7 border border-offwhite/7 min-w-[900px]">
            {days.map(d => {
              const ds = format(d, 'yyyy-MM-dd')
              const dayAppts = byDate[ds] ?? []
              const todayCell = isToday(d)
              return (
                <div key={ds} className="bg-charcoal min-h-[420px] flex flex-col">
                  <Link
                    href={`/admin/agenda?view=day&date=${ds}`}
                    className={cn(
                      'px-3 py-3 border-b border-offwhite/7 hover:bg-offwhite/3 transition-colors',
                      todayCell && 'bg-sage/8'
                    )}
                  >
                    <p className="font-body font-light text-[7.5px] tracking-[0.25em] uppercase text-offwhite/30 capitalize">
                      {format(d, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={cn(
                      'font-data text-[18px] leading-none mt-1',
                      todayCell ? 'text-sage-light' : 'text-offwhite/70'
                    )}>
                      {format(d, 'd')}
                    </p>
                  </Link>
                  <div className="flex-1 p-2 space-y-[6px]">
                    {dayAppts.length === 0 ? (
                      <p className="font-body font-light text-[9px] text-offwhite/12 italic px-1 pt-2">—</p>
                    ) : (
                      dayAppts.map(a => {
                        const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
                        const cli  = Array.isArray(a.clients)    ? a.clients[0]    : a.clients
                        const time = slot?.start_time?.substring(0, 5) ?? '--'
                        return (
                          <Link
                            key={a.id}
                            href={`/admin/agenda?view=day&date=${ds}`}
                            className="block px-[8px] py-[6px] bg-offwhite/3 border border-offwhite/7 hover:border-sage/30 hover:bg-sage/6 transition-all duration-150"
                          >
                            <div className="flex items-center gap-[6px] mb-[2px]">
                              <span className={cn('w-[6px] h-[6px] rounded-full shrink-0', STATUS_DOT[a.status] ?? STATUS_DOT.pending)} />
                              <span className="font-data text-[10.5px] text-offwhite/60">{time}</span>
                            </div>
                            <p className="font-body font-light text-[10px] text-offwhite/75 truncate">
                              {cli?.name ?? '—'}
                            </p>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Month view — full-month grid, chips link into the day view ──
  const monthStart = startOfMonth(dateObj)
  const monthEnd   = endOfMonth(dateObj)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const today      = format(new Date(), 'yyyy-MM-dd')
  const prev       = format(subMonths(dateObj, 1), 'yyyy-MM-dd')
  const next       = format(addMonths(dateObj, 1), 'yyyy-MM-dd')
  const label      = format(dateObj, "MMMM 'de' yyyy", { locale: ptBR })
  const WEEKDAY    = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  const { data: raw } = await db
    .from('appointments')
    .select('id, status, clients(name), time_slots!inner(date, start_time)')
    .gte('time_slots.date', format(gridStart, 'yyyy-MM-dd'))
    .lte('time_slots.date', format(gridEnd, 'yyyy-MM-dd'))
    .order('time_slots(start_time)', { ascending: true })

  const appts = (raw ?? []) as any[]
  const byDate: Record<string, any[]> = {}
  for (const a of appts) {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    const d = slot?.date
    if (!d) continue
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(a)
  }

  const MAX_VISIBLE = 3

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
          <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
            {label}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher view={view} dateStr={dateStr} />
          <NavArrows
            prevHref={`/admin/agenda?view=month&date=${prev}`}
            todayHref={`/admin/agenda?view=month&date=${today}`}
            nextHref={`/admin/agenda?view=month&date=${next}`}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 gap-[1px] bg-offwhite/7 border border-offwhite/7 border-b-0">
            {WEEKDAY.map(w => (
              <div key={w} className="bg-charcoal-mid px-3 py-2">
                <p className="font-body font-light text-[7.5px] tracking-[0.25em] uppercase text-offwhite/30">{w}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[1px] bg-offwhite/7 border border-offwhite/7">
            {days.map(d => {
              const ds = format(d, 'yyyy-MM-dd')
              const dayAppts = byDate[ds] ?? []
              const inMonth = isSameMonth(d, dateObj)
              const todayCell = isToday(d)
              const visible = dayAppts.slice(0, MAX_VISIBLE)
              const overflow = dayAppts.length - visible.length

              return (
                <Link
                  key={ds}
                  href={`/admin/agenda?view=day&date=${ds}`}
                  className={cn(
                    'bg-charcoal min-h-[110px] p-2 flex flex-col hover:bg-offwhite/3 transition-colors',
                    !inMonth && 'opacity-30',
                    todayCell && 'bg-sage/8'
                  )}
                >
                  <p className={cn(
                    'font-data text-[13px] leading-none mb-[6px]',
                    todayCell ? 'text-sage-light' : 'text-offwhite/60'
                  )}>
                    {format(d, 'd')}
                  </p>
                  <div className="space-y-[3px]">
                    {visible.map(a => {
                      const cli  = Array.isArray(a.clients) ? a.clients[0] : a.clients
                      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
                      const time = slot?.start_time?.substring(0, 5) ?? ''
                      return (
                        <div key={a.id} className="flex items-center gap-[5px]">
                          <span className={cn('w-[5px] h-[5px] rounded-full shrink-0', STATUS_DOT[a.status] ?? STATUS_DOT.pending)} />
                          <span className="font-body font-light text-[8.5px] text-offwhite/55 truncate">
                            {time} {cli?.name ?? ''}
                          </span>
                        </div>
                      )
                    })}
                    {overflow > 0 && (
                      <p className="font-body font-light text-[8px] text-offwhite/25 pl-[10px]">+{overflow} mais</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
