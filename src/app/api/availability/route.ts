import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { BOOKING } from '@/config/booking'
import { addDays, format, startOfDay } from 'date-fns'

type BlockedRow = { date_start: string; date_end: string }
type SlotRow    = { id: string; date: string; start_time: string; end_time: string; status: string }
type RuleRow    = { weekday: number; start_time: string; end_time: string }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  // Duration (minutes) of the service being booked — determines which start
  // times leave enough room before a break or closing time. Defaults to a
  // single 60-min grid slot when not provided.
  const duration = Math.max(60, parseInt(searchParams.get('duration') ?? '60'))
  const slotsNeeded = Math.ceil(duration / BOOKING.slotDurationMinutes)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  const monthStart = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
  const monthEnd   = format(new Date(year, month, 0),     'yyyy-MM-dd')

  // If the DB is unreachable (bad config, outage), degrade to the built-in
  // demo schedule below instead of 500ing the whole calendar.
  let blocked: BlockedRow[] = []
  let existingSlots: SlotRow[] = []
  let dbRules: RuleRow[] = []
  let db: any = null

  try {
    db = await createServiceClient()

    const [blockedRes, slotsRes, rulesRes] = await Promise.all([
      db.from('blocked_periods')
        .select('date_start, date_end')
        .lte('date_start', monthEnd)
        .gte('date_end',   monthStart),
      db.from('time_slots')
        .select('id, date, start_time, end_time, status')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date',       { ascending: true })
        .order('start_time', { ascending: true }),
      db.from('availability_rules')
        .select('weekday, start_time, end_time')
        .eq('active', true),
    ]) as [
      { data: BlockedRow[] | null },
      { data: SlotRow[]    | null },
      { data: RuleRow[]    | null },
    ]

    blocked       = blockedRes.data ?? []
    existingSlots = slotsRes.data   ?? []
    dbRules       = rulesRes.data   ?? []
  } catch (error) {
    console.error('GET /api/availability unexpected error:', error)
  }

  // Fall back to default schedule (10h–19h, Mon–Sat) when DB has no rules configured
  const useDemoMode = dbRules.length === 0
  const rules: RuleRow[] = useDemoMode
    ? [
        { weekday: 1, start_time: '10:00', end_time: '19:00' },
        { weekday: 2, start_time: '10:00', end_time: '19:00' },
        { weekday: 3, start_time: '10:00', end_time: '19:00' },
        { weekday: 4, start_time: '10:00', end_time: '19:00' },
        { weekday: 5, start_time: '10:00', end_time: '19:00' },
        { weekday: 6, start_time: '10:00', end_time: '19:00' },
      ]
    : dbRules

  // Demo: deterministically "fill" some slots so the picker shows variety
  // Pattern: on even days book 11h & 15h; on odd days book 13h & 17h
  const getDemoBooked = (dayNum: number): Set<string> =>
    dayNum % 2 === 0
      ? new Set(['11:00', '15:00'])
      : new Set(['13:00', '17:00'])

  // Lazy slot generation — generate for dates with no slots yet
  const datesWithSlots = new Set(existingSlots.map(s => s.date))
  const today          = startOfDay(new Date())
  const maxDate        = addDays(today, BOOKING.maxDaysAhead)
  const daysInMonth    = new Date(year, month, 0).getDate()
  const gridMinutes    = BOOKING.slotDurationMinutes // grid granularity (1h) — not the service duration

  const toInsert: { date: string; start_time: string; end_time: string; status: string }[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d)
    const dateStr = format(dateObj, 'yyyy-MM-dd')

    if (datesWithSlots.has(dateStr))                                             continue
    if (startOfDay(dateObj) < today)                                             continue
    if (dateObj > maxDate)                                                       continue
    if (BOOKING.blockedWeekdays.includes(dateObj.getDay()))                      continue
    if (blocked.some(b => dateStr >= b.date_start && dateStr <= b.date_end))     continue

    // A weekday can have more than one window (e.g. 10h-12h and 15h-20h with
    // a lunch break in between) — generate slots for every matching window,
    // not just the first one.
    const windows = rules.filter(r => r.weekday === dateObj.getDay())
    if (windows.length === 0) continue

    const demoBooked = useDemoMode ? getDemoBooked(d) : new Set<string>()

    for (const rule of windows) {
      const [sh, sm] = rule.start_time.split(':').map(Number)
      const [eh, em] = rule.end_time.split(':').map(Number)
      const endMin   = eh * 60 + em

      let cur = sh * 60 + sm
      while (cur + gridMinutes <= endMin) {
        const h1 = Math.floor(cur / 60), m1 = cur % 60
        const h2 = Math.floor((cur + gridMinutes) / 60), m2 = (cur + gridMinutes) % 60
        const startStr = `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`
        toInsert.push({
          date:       dateStr,
          start_time: startStr,
          end_time:   `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`,
          status:     demoBooked.has(startStr) ? 'booked' : 'available',
        })
        cur += gridMinutes
      }
    }
  }

  // Only persist to DB when using real rules (not demo mode) and the client is up
  if (toInsert.length > 0 && !useDemoMode && db) {
    await db.from('time_slots').insert(toInsert)
  }

  // Merge generated slots with existing
  const allSlots: SlotRow[] = [
    ...existingSlots,
    ...toInsert.map((s, i) => ({ id: `gen-${i}`, ...s })),
  ]

  // Build availability map
  const availability: Record<string, {
    available: boolean
    slots: { id: string; startTime: string; available: boolean }[]
  }> = {}

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d)
    const dateStr = format(dateObj, 'yyyy-MM-dd')

    const unavailable = (
      startOfDay(dateObj) < today ||
      dateObj > maxDate ||
      BOOKING.blockedWeekdays.includes(dateObj.getDay()) ||
      blocked.some(b => dateStr >= b.date_start && dateStr <= b.date_end)
    )

    if (unavailable) {
      availability[dateStr] = { available: false, slots: [] }
      continue
    }

    const rawDaySlots = allSlots
      .filter(s => s.date === dateStr)
      .map(s => ({
        id:        s.id,
        startTime: s.start_time.substring(0, 5),
        available: s.status === 'available',
      }))

    // A start time is only bookable for this service if it and the next
    // (slotsNeeded - 1) consecutive grid slots are all available. This is
    // what keeps a 2h service from being offered at a time that would
    // invade a break or run past closing — those follow-up slots simply
    // don't exist in the grid, so the check fails naturally.
    const byStart = new Map(rawDaySlots.map(s => [s.startTime, s]))
    const daySlots = rawDaySlots.map(s => {
      if (!s.available) return s
      let stillFits = true
      let [h, m] = s.startTime.split(':').map(Number)
      for (let i = 1; i < slotsNeeded; i++) {
        m += gridMinutes
        h += Math.floor(m / 60)
        m %= 60
        const nextStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        const next = byStart.get(nextStart)
        if (!next || !next.available) { stillFits = false; break }
      }
      return stillFits ? s : { ...s, available: false }
    })

    availability[dateStr] = {
      available: daySlots.some(s => s.available),
      slots:     daySlots,
    }
  }

  return NextResponse.json({ year, month, availability }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
