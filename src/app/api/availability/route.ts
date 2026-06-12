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
  const rules         = rulesRes.data   ?? []

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

    let cur = sh * 60 + sm
    while (cur + duration <= endMin) {
      const h1 = Math.floor(cur / 60), m1 = cur % 60
      const h2 = Math.floor((cur + duration) / 60), m2 = (cur + duration) % 60
      toInsert.push({
        date:       dateStr,
        start_time: `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`,
        end_time:   `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`,
        status:     'available',
      })
      cur += duration
    }
  }

  if (toInsert.length > 0) {
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
