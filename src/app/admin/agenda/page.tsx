import { createServiceClient } from '@/lib/supabase/server'
import {
  format, addDays, subDays, parseISO,
  startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { DayGrid, type GridAppointment, type BlockedRange, STATUS_BLOCK } from '@/components/admin/DayGrid'
import { WeekGrid, type WeekDay } from '@/components/admin/WeekGrid'
import { NewAppointmentButton } from '@/components/admin/NewAppointmentButton'
import { DayOffToggleButton } from '@/components/admin/DayOffToggleButton'
import { BlockTimeButton } from '@/components/admin/BlockTimeButton'
import { AgendaMiniCalendar } from '@/components/admin/AgendaMiniCalendar'
import { AgendaViewDropdown, type AgendaView } from '@/components/admin/AgendaViewDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { timeToMinutes } from '@/lib/schedule/dayGridLayout'
import { BOOKING } from '@/config/booking'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function NavArrows({ prevHref, todayHref, nextHref }: { prevHref: string; todayHref: string; nextHref: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link href={prevHref} className="shrink-0 w-[36px] h-[36px] border border-offwhite/14 text-offwhite/55 text-[15px] flex items-center justify-center hover:border-gold/50 hover:text-gold transition-all duration-200">
        ‹
      </Link>
      <Link href={todayHref} className="shrink-0 whitespace-nowrap px-4 h-[36px] border border-offwhite/14 font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/55 flex items-center hover:border-gold/50 hover:text-gold transition-all duration-200">
        Hoje
      </Link>
      <Link href={nextHref} className="shrink-0 w-[36px] h-[36px] border border-offwhite/14 text-offwhite/55 text-[15px] flex items-center justify-center hover:border-gold/50 hover:text-gold transition-all duration-200">
        ›
      </Link>
    </div>
  )
}

function mapAppointmentRow(a: any): GridAppointment {
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
}

const APPOINTMENT_SELECT = 'id, reference_code, status, notes, total_price, checked_in_at, services(name, price, duration), clients(id, name, whatsapp, vip), time_slots!inner(date, start_time, end_time)'

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { view?: string; date?: string }
}) {
  const view: AgendaView =
    searchParams.view === 'workweek' || searchParams.view === 'week' || searchParams.view === 'month'
      ? searchParams.view
      : 'day'
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

    const [apptsRes, rulesRes, blockedRes, blockedSlotsRes] = await Promise.all([
      db.from('appointments')
        .select(APPOINTMENT_SELECT)
        .eq('time_slots.date', dateStr)
        .order('time_slots(start_time)', { ascending: true }),
      db.from('availability_rules').select('start_time, end_time').eq('weekday', weekday).eq('active', true),
      db.from('blocked_periods').select('id').lte('date_start', dateStr).gte('date_end', dateStr),
      db.from('time_slots').select('start_time, end_time').eq('date', dateStr).eq('status', 'blocked').order('start_time', { ascending: true }),
    ])

    const appts  = (apptsRes.data  ?? []) as any[]
    const rules  = (rulesRes.data  ?? []) as { start_time: string; end_time: string }[]
    const blockedAllDay = ((blockedRes.data ?? []) as any[]).length > 0
    const blockedPeriodId = ((blockedRes.data ?? []) as { id: string }[])[0]?.id ?? null
    const blockedSlots = (blockedSlotsRes.data ?? []) as { start_time: string; end_time: string }[]

    // Grid spans the earliest rule start to the latest rule end for the day,
    // falling back to a sensible default when there's no rule (e.g. a
    // day normally closed, but with a one-off appointment on it anyway).
    const ruleStarts = rules.map(r => timeToMinutes(r.start_time))
    const ruleEnds   = rules.map(r => timeToMinutes(r.end_time))
    const gridStartMin = ruleStarts.length ? Math.min(...ruleStarts) : timeToMinutes('07:00')
    const gridEndMin   = ruleEnds.length   ? Math.max(...ruleEnds)   : timeToMinutes('20:00')

    // Merge contiguous blocked slots (e.g. 12:00-13:00 + 13:00-14:00) into a
    // single visual range instead of drawing a seam between adjacent hours.
    const blockedRanges: BlockedRange[] = []
    for (const s of blockedSlots) {
      const startMin = timeToMinutes(s.start_time.substring(0, 5))
      const endMin   = timeToMinutes(s.end_time.substring(0, 5))
      const last = blockedRanges[blockedRanges.length - 1]
      if (last && last.endMin === startMin) last.endMin = endMin
      else blockedRanges.push({ startMin, endMin })
    }

    const gridAppointments: GridAppointment[] = appts.map(mapAppointmentRow)

    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
            <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
              {label}
            </h1>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto flex-nowrap pb-1 -mb-1 md:flex-wrap md:overflow-visible md:pb-0 md:mb-0">
            <NewAppointmentButton />
            <DayOffToggleButton
              date={dateStr}
              blocked={blockedAllDay}
              blockedPeriodId={blockedPeriodId}
              appointmentCount={gridAppointments.length}
            />
            <BlockTimeButton
              date={dateStr}
              gridStartMin={gridStartMin}
              gridEndMin={gridEndMin}
              hasRule={rules.length > 0}
            />
            <AgendaViewDropdown view={view} dateStr={dateStr} />
            <NavArrows
              prevHref={`/admin/agenda?view=day&date=${prev}`}
              todayHref={`/admin/agenda?view=day&date=${today}`}
              nextHref={`/admin/agenda?view=day&date=${next}`}
            />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 md:gap-6">
          <AgendaMiniCalendar selectedDate={dateStr} view={view} />
          <div className="flex-1 min-w-0">
            <DayGrid
              date={dateStr}
              gridStartMin={gridStartMin}
              gridEndMin={gridEndMin}
              blockedAllDay={blockedAllDay}
              blockedRanges={blockedRanges}
              appointments={gridAppointments}
              prevHref={`/admin/agenda?view=day&date=${prev}`}
              nextHref={`/admin/agenda?view=day&date=${next}`}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Week / Semana Útil views — multi-column hour-ruler grid ──
  if (view === 'week' || view === 'workweek') {
    const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 })
    const weekEnd   = endOfWeek(dateObj,   { weekStartsOn: 1 })
    const allDays   = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const days      = view === 'workweek'
      ? allDays.filter(d => !BOOKING.blockedWeekdays.includes(d.getDay()))
      : allDays
    const today     = format(new Date(), 'yyyy-MM-dd')
    const prev      = format(subWeeks(dateObj, 1), 'yyyy-MM-dd')
    const next      = format(addWeeks(dateObj, 1), 'yyyy-MM-dd')
    const label     = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`
    const dateStrs  = days.map(d => format(d, 'yyyy-MM-dd'))
    const weekdays  = Array.from(new Set(days.map(d => d.getDay())))

    const [apptsRes, rulesRes, blockedRes] = await Promise.all([
      db.from('appointments')
        .select(APPOINTMENT_SELECT)
        .gte('time_slots.date', format(weekStart, 'yyyy-MM-dd'))
        .lte('time_slots.date', format(weekEnd, 'yyyy-MM-dd'))
        .order('time_slots(start_time)', { ascending: true }),
      db.from('availability_rules').select('weekday, start_time, end_time').in('weekday', weekdays).eq('active', true),
      db.from('blocked_periods').select('date_start, date_end').lte('date_start', dateStrs[dateStrs.length - 1]).gte('date_end', dateStrs[0]),
    ])

    const rules = (rulesRes.data ?? []) as { weekday: number; start_time: string; end_time: string }[]
    const blockedPeriods = (blockedRes.data ?? []) as { date_start: string; date_end: string }[]

    // Bucket appointments by date (mapAppointmentRow doesn't carry the date,
    // so read it off the raw row's time_slots join before mapping).
    const byDate: Record<string, GridAppointment[]> = {}
    for (const raw of (apptsRes.data ?? []) as any[]) {
      const slot = Array.isArray(raw.time_slots) ? raw.time_slots[0] : raw.time_slots
      const d = slot?.date
      if (!d) continue
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(mapAppointmentRow(raw))
    }

    const ruleStarts = rules.map(r => timeToMinutes(r.start_time))
    const ruleEnds   = rules.map(r => timeToMinutes(r.end_time))
    const gridStartMin = ruleStarts.length ? Math.min(...ruleStarts) : timeToMinutes('07:00')
    const gridEndMin   = ruleEnds.length   ? Math.max(...ruleEnds)   : timeToMinutes('20:00')

    const weekDays: WeekDay[] = days.map(d => {
      const ds = format(d, 'yyyy-MM-dd')
      const blockedAllDay = blockedPeriods.some(b => ds >= b.date_start && ds <= b.date_end)
      return {
        date: ds,
        label: format(d, 'EEEE', { locale: ptBR }),
        dayNumber: d.getDate(),
        isToday: isToday(d),
        isWeekendClosed: BOOKING.blockedWeekdays.includes(d.getDay()),
        blockedAllDay,
        appointments: byDate[ds] ?? [],
      }
    })

    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
            <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
              {label}
            </h1>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto flex-nowrap pb-1 -mb-1 md:flex-wrap md:overflow-visible md:pb-0 md:mb-0">
            <NewAppointmentButton />
            <AgendaViewDropdown view={view} dateStr={dateStr} />
            <NavArrows
              prevHref={`/admin/agenda?view=${view}&date=${prev}`}
              todayHref={`/admin/agenda?view=${view}&date=${today}`}
              nextHref={`/admin/agenda?view=${view}&date=${next}`}
            />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 md:gap-6">
          <AgendaMiniCalendar selectedDate={dateStr} view={view} />
          <div className="flex-1 min-w-0">
            <WeekGrid days={weekDays} gridStartMin={gridStartMin} gridEndMin={gridEndMin} />
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
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
          <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
            {label}
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <NewAppointmentButton />
          <AgendaViewDropdown view={view} dateStr={dateStr} />
          <NavArrows
            prevHref={`/admin/agenda?view=month&date=${prev}`}
            todayHref={`/admin/agenda?view=month&date=${today}`}
            nextHref={`/admin/agenda?view=month&date=${next}`}
          />
          <ThemeToggle />
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
                    todayCell && 'bg-gold/8'
                  )}
                >
                  <p className={cn(
                    'font-data text-[13px] leading-none mb-[6px]',
                    todayCell ? 'text-gold' : 'text-offwhite/60'
                  )}>
                    {format(d, 'd')}
                  </p>
                  <div className="space-y-[3px]">
                    {visible.map(a => {
                      const cli  = Array.isArray(a.clients) ? a.clients[0] : a.clients
                      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
                      const time = slot?.start_time?.substring(0, 5) ?? ''
                      return (
                        <p
                          key={a.id}
                          className={cn(
                            'px-[5px] py-[1px] border-l-2 text-[8.5px] font-body font-light truncate',
                            STATUS_BLOCK[a.status] ?? STATUS_BLOCK.pending,
                          )}
                        >
                          {time} {cli?.name ?? ''}
                        </p>
                      )
                    })}
                    {overflow > 0 && (
                      <p className="font-body font-light text-[8px] text-offwhite/25 pl-[6px]">+{overflow} mais</p>
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
