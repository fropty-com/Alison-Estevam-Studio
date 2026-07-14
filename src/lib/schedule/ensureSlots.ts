import { BOOKING, SLOT_STATUS } from '@/config/booking'

/**
 * Slot generation is normally lazy, triggered by /api/availability for the
 * month currently being viewed on the public calendar. A future date that
 * nobody has viewed yet may have zero time_slots rows — this fills them in
 * on demand so admin actions (blocking a time range) work regardless of
 * whether a client has ever loaded that month.
 */
export async function ensureSlotsForDate(db: any, date: string): Promise<void> {
  const weekday = new Date(`${date}T00:00:00`).getDay()

  const [rulesRes, existingRes] = await Promise.all([
    db.from('availability_rules').select('start_time, end_time').eq('weekday', weekday).eq('active', true),
    db.from('time_slots').select('start_time').eq('date', date),
  ])

  const rules = (rulesRes.data ?? []) as { start_time: string; end_time: string }[]
  if (rules.length === 0) return

  const existingStarts = new Set(((existingRes.data ?? []) as { start_time: string }[]).map(s => s.start_time.substring(0, 5)))

  const gridMinutes = BOOKING.slotDurationMinutes
  const toInsert: { date: string; start_time: string; end_time: string; status: string }[] = []

  for (const rule of rules) {
    const [sh, sm] = rule.start_time.split(':').map(Number)
    const [eh, em] = rule.end_time.split(':').map(Number)
    const endMin = eh * 60 + em

    let cur = sh * 60 + sm
    while (cur + gridMinutes <= endMin) {
      const h1 = Math.floor(cur / 60), m1 = cur % 60
      const h2 = Math.floor((cur + gridMinutes) / 60), m2 = (cur + gridMinutes) % 60
      const startStr = `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`
      if (!existingStarts.has(startStr)) {
        toInsert.push({
          date,
          start_time: startStr,
          end_time: `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`,
          status: SLOT_STATUS.AVAILABLE,
        })
      }
      cur += gridMinutes
    }
  }

  if (toInsert.length > 0) {
    await db.from('time_slots').insert(toInsert)
  }
}
