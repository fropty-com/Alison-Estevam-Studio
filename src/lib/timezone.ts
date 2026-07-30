const TIMEZONE = 'America/Sao_Paulo'

/**
 * Vercel's Node runtime defaults to UTC regardless of the `regions` config,
 * so `new Date().getFullYear()/getMonth()/getDate()` (and anything built on
 * top of them, like date-fns' `format`/`startOfMonth`) silently roll over to
 * the next calendar day between 21:00 and 23:59 America/Sao_Paulo. Every
 * "today"/"this week"/"this month" boundary used for business logic must go
 * through these helpers instead of `new Date()` + date-fns directly.
 */
function partsInSaoPaulo(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) }
}

export function todayInSaoPaulo(date: Date = new Date()): string {
  const { year, month, day } = partsInSaoPaulo(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function startOfWeekInSaoPaulo(date: Date = new Date()): string {
  const { year, month, day } = partsInSaoPaulo(date)
  const anchor = new Date(Date.UTC(year, month - 1, day))
  const weekday = anchor.getUTCDay() // 0=Sun..6=Sat
  const diff = (weekday === 0 ? -6 : 1) - weekday // Monday-start week
  anchor.setUTCDate(anchor.getUTCDate() + diff)
  return anchor.toISOString().slice(0, 10)
}

export function endOfWeekInSaoPaulo(date: Date = new Date()): string {
  const start = startOfWeekInSaoPaulo(date)
  const end = new Date(`${start}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 6)
  return end.toISOString().slice(0, 10)
}

export function startOfMonthInSaoPaulo(date: Date = new Date()): string {
  const { year, month } = partsInSaoPaulo(date)
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/**
 * Returns a Date anchored at noon UTC on "today" in America/Sao_Paulo.
 * Drop-in replacement for `const now = new Date()` in code that then feeds
 * `now` into date-fns (`startOfMonth`, `subMonths`, `format`, etc.) — because
 * the anchor's UTC calendar date already matches São Paulo's, and the server
 * runtime is UTC, every date-fns call downstream reads the correct day/month
 * without needing to be rewritten individually.
 */
export function nowAnchorInSaoPaulo(date: Date = new Date()): Date {
  const { year, month, day } = partsInSaoPaulo(date)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

/** Semantic alias of `nowAnchorInSaoPaulo` for call sites anchoring an
 * arbitrary instant (e.g. `paid_at`) rather than "now" — same function. */
export const dateAnchorInSaoPaulo = nowAnchorInSaoPaulo

function shiftDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

export function isTodayInSaoPaulo(date: Date): boolean {
  return todayInSaoPaulo(date) === todayInSaoPaulo()
}

export function isYesterdayInSaoPaulo(date: Date): boolean {
  return todayInSaoPaulo(date) === shiftDays(todayInSaoPaulo(), -1)
}

/**
 * Formats an instant (paid_at, checked_in_at, created_at — any timestamptz)
 * as its wall-clock HH:mm in America/Sao_Paulo. Formatting a timestamptz
 * with date-fns' `format(date, 'HH:mm')` reads the runtime's local hour
 * (UTC on Vercel), so a 22:00 BRT event would display as "01:00" — always
 * go through this helper for any time shown to the barber or the client.
 */
export function formatTimeInSaoPaulo(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function monthKeyInSaoPaulo(date: Date = new Date()): string {
  const { year, month } = partsInSaoPaulo(date)
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Weekday of an instant in America/Sao_Paulo, 0=Sun..6=Sat (matches date-fns `getDay`). */
export function weekdayInSaoPaulo(date: Date): number {
  const { year, month, day } = partsInSaoPaulo(date)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}
