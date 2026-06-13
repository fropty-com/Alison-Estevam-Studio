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

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  const db = await createServiceClient() as any

  const monthStart = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
  const monthEnd   = format(new Date(year, month, 0),     'yyyy-MM-dd')

  // Fetch blocked periods, existing slots, and rules in parallel
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

  const blocked       = blockedRes.data ?? []
  const existingSlots = slotsRes.data   ?? []
  const dbRules       = rulesRes.data   ?? []

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
  const duration       = BOOKING.slotDurationMinutes

  const toInsert: { date: string; start_time: string; end_time: string; status: string }[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d)
    const dateStr = format(dateObj, 'yyyy-MM-dd')

    if (datesWithSlots.has(dateStr))                                             continue
    if (startOfDay(dateObj) < today)                                             continue
    if (dateObj > maxDate)                                                       continue
    if (BOOKING.blockedWeekdays.includes(dateObj.getDay()))                      continue
    if (blocked.some(b => dateStr >= b.date_start && dateStr <= b.date_end))     continue

    const rule = rules.find(r => r.weekday === dateObj.getDay())
    if (!rule) continue

    const [sh, sm] = rule.start_time.split(':').map(Number)
    const [eh, em] = rule.end_time.split(':').map(Number)
    const endMin   = eh * 60 + em
    const demoBooked = useDemoMode ? getDemoBooked(d) : new Set<string>()

    let cur = sh * 60 + sm
    while (cur + duration <= endMin) {
      const h1 = Math.floor(cur / 60), m1 = cur % 60
      const h2 = Math.floor((cur + duration) / 60), m2 = (cur + duration) % 60
      const startStr = `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`
      toInsert.push({
        date:       dateStr,
        start_time: startStr,
        end_time:   `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`,
        status:     demoBooked.has(startStr) ? 'booked' : 'available',
      })
      cur += duration
    }
  }

  // Only persist to DB when using real rules (not demo mode)
  if (toInsert.length > 0 && !useDemoMode) {
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

    const daySlots = allSlots
      .filter(s => s.date === dateStr)
      .map(s => ({
        id:        s.id,
        startTime: s.start_time.substring(0, 5),
        available: s.status === 'available',
      }))

    availability[dateStr] = {
      available: daySlots.some(s => s.available),
      slots:     daySlots,
    }
  }

  return NextResponse.json({ year, month, availability }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
