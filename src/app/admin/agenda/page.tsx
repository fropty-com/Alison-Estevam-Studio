import { createServiceClient } from '@/lib/supabase/server'
import {
  format, addDays, subDays, parseISO,
  startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { AppointmentActions } from '@/components/admin/AppointmentActions'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; color: string; border: string }> = {
  pending:     { label: 'Pendente',    color: 'text-warning',      border: 'border-l-warning'      },
  confirmed:   { label: 'Confirmado',  color: 'text-sage-light',   border: 'border-l-sage'         },
  checked_in:  { label: 'Chegou',      color: 'text-gold',         border: 'border-l-gold'         },
  in_progress: { label: 'Em atendimento', color: 'text-gold',      border: 'border-l-gold'         },
  completed:   { label: 'Concluído',   color: 'text-offwhite/35',  border: 'border-l-offwhite/20'  },
  cancelled:   { label: 'Cancelado',   color: 'text-error/50',     border: 'border-l-error/40'     },
  no_show:     { label: 'No-show',     color: 'text-error/40',     border: 'border-l-error/25'     },
}

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

  // ── Day view — unchanged, full detail with check-in/checkout actions ──
  if (view === 'day') {
    const prev  = format(subDays(dateObj, 1), 'yyyy-MM-dd')
    const next  = format(addDays(dateObj, 1), 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    const label = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR })

    const { data: raw } = await db
      .from('appointments')
      .select('id, reference_code, status, notes, total_price, checked_in_at, services(name, price, duration), clients(id, name, whatsapp, vip), time_slots!inner(date, start_time, end_time)')
      .eq('time_slots.date', dateStr)
      .order('time_slots(start_time)', { ascending: true })

    const appts = (raw ?? []) as any[]

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
              prevHref={`/admin/agenda?view=day&date=${prev}`}
              todayHref={`/admin/agenda?view=day&date=${today}`}
              nextHref={`/admin/agenda?view=day&date=${next}`}
            />
          </div>
        </div>

        {appts.length === 0 ? (
          <div className="bg-offwhite/3 border border-offwhite/7 p-10 text-center">
            <p className="font-display font-light text-[20px] text-offwhite/18 italic">
              Nenhum agendamento para este dia.
            </p>
          </div>
        ) : (
          <div className="space-y-[8px]">
            {appts.map((a: any) => {
              const st   = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
              const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
              const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
              const cli  = Array.isArray(a.clients)    ? a.clients[0]    : a.clients
              const time = slot?.start_time?.substring(0, 5) ?? '--'

              return (
                <div key={a.id} className={cn('bg-offwhite/3 border border-offwhite/7 border-l-[3px] p-5', st.border)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="shrink-0 text-center">
                        <p className="font-data text-[22px] text-offwhite/70 leading-none">{time}</p>
                        <p className="font-body font-light text-[8px] text-offwhite/25 mt-[3px] tracking-[0.15em]">
                          {svc?.duration ? `${svc.duration}min` : ''}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-[3px]">
                          <p className="font-body font-light text-[14px] text-offwhite">{cli?.name ?? '—'}</p>
                          {cli?.vip && (
                            <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70">VIP</span>
                          )}
                        </div>
                        <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.15em] mb-[2px]">
                          {svc?.name ?? '—'} · {svc?.price ? `R$ ${svc.price}` : ''}
                        </p>
                        <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">
                          {cli?.whatsapp} · #{a.reference_code}
                          {a.checked_in_at && ` · chegou às ${format(new Date(a.checked_in_at), 'HH:mm')}`}
                        </p>
                        {a.notes && (
                          <p className="mt-2 font-body font-light text-[10px] text-offwhite/40 italic border-l border-offwhite/12 pl-2">
                            {a.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={cn('font-body font-light text-[8px] tracking-[0.22em] uppercase shrink-0', st.color)}>
                      {st.label}
                    </span>
                  </div>

                  <AppointmentActions id={a.id} status={a.status} notes={a.notes} totalPrice={Number(a.total_price)} />
                </div>
              )
            })}
          </div>
        )}
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
