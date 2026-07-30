import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  todayInSaoPaulo, startOfWeekInSaoPaulo, endOfWeekInSaoPaulo, startOfMonthInSaoPaulo,
  nowAnchorInSaoPaulo, isTodayInSaoPaulo, isYesterdayInSaoPaulo, formatTimeInSaoPaulo,
  monthKeyInSaoPaulo, weekdayInSaoPaulo,
} from './timezone'

// Brazil has had no DST since 2019, so America/Sao_Paulo is a fixed UTC-3 —
// these fixtures don't need to account for any offset shift.

describe('todayInSaoPaulo', () => {
  it('rolls back to the previous day for a UTC instant just after midnight', () => {
    // 2026-01-15T02:00:00Z = 2026-01-14T23:00:00-03:00 (still Jan 14 in São Paulo)
    expect(todayInSaoPaulo(new Date('2026-01-15T02:00:00Z'))).toBe('2026-01-14')
  })

  it('matches the UTC date once past the 03:00Z boundary', () => {
    expect(todayInSaoPaulo(new Date('2026-01-15T03:00:00Z'))).toBe('2026-01-15')
  })
})

describe('formatTimeInSaoPaulo', () => {
  it('converts a late-UTC instant back to the correct São Paulo evening hour', () => {
    expect(formatTimeInSaoPaulo(new Date('2026-01-15T02:00:00Z'))).toBe('23:00')
  })
})

describe('isTodayInSaoPaulo / isYesterdayInSaoPaulo', () => {
  afterEach(() => vi.useRealTimers())

  it('treats a UTC instant that already rolled over as still "today" in São Paulo', () => {
    // System clock at 2026-01-15T02:00:00Z = Jan 14 23:00 in São Paulo ("today" is Jan 14)
    vi.useFakeTimers().setSystemTime(new Date('2026-01-15T02:00:00Z'))
    expect(isTodayInSaoPaulo(new Date('2026-01-14T23:30:00Z'))).toBe(true) // Jan 14 20:30 BRT — same SP day
    expect(isTodayInSaoPaulo(new Date('2026-01-15T13:00:00Z'))).toBe(false) // Jan 15 10:00 BRT — next SP day
  })

  it('identifies yesterday correctly across a month boundary', () => {
    // System clock at 2026-02-01T02:00:00Z = Jan 31 23:00 in São Paulo ("today" is Jan 31)
    vi.useFakeTimers().setSystemTime(new Date('2026-02-01T02:00:00Z'))
    expect(isYesterdayInSaoPaulo(new Date('2026-01-30T13:00:00Z'))).toBe(true) // Jan 30 10:00 BRT
    expect(isYesterdayInSaoPaulo(new Date('2026-01-31T13:00:00Z'))).toBe(false) // same SP day as "today"
  })
})

describe('startOfWeekInSaoPaulo / endOfWeekInSaoPaulo', () => {
  it('anchors the week to Monday..Sunday around a known Wednesday', () => {
    // 2026-01-14 is a Wednesday
    const d = new Date('2026-01-14T15:00:00Z')
    expect(startOfWeekInSaoPaulo(d)).toBe('2026-01-12')
    expect(endOfWeekInSaoPaulo(d)).toBe('2026-01-18')
  })
})

describe('startOfMonthInSaoPaulo / monthKeyInSaoPaulo', () => {
  it('derives month boundaries from the São Paulo calendar date, not UTC', () => {
    // 2026-02-01T02:00:00Z is still Jan 31 in São Paulo
    const d = new Date('2026-02-01T02:00:00Z')
    expect(startOfMonthInSaoPaulo(d)).toBe('2026-01-01')
    expect(monthKeyInSaoPaulo(d)).toBe('2026-01')
  })
})

describe('nowAnchorInSaoPaulo', () => {
  it('produces a UTC-midday Date whose calendar fields match the São Paulo date', () => {
    const anchor = nowAnchorInSaoPaulo(new Date('2026-02-01T02:00:00Z'))
    expect(anchor.getUTCFullYear()).toBe(2026)
    expect(anchor.getUTCMonth()).toBe(0) // January
    expect(anchor.getUTCDate()).toBe(31)
  })
})

describe('weekdayInSaoPaulo', () => {
  it('matches getDay convention (0=Sun..6=Sat) using the São Paulo calendar date', () => {
    // 2026-01-14 is a Wednesday (3), but at 02:00Z it's still Jan 13 (Tuesday, 2) in São Paulo
    expect(weekdayInSaoPaulo(new Date('2026-01-14T15:00:00Z'))).toBe(3)
    expect(weekdayInSaoPaulo(new Date('2026-01-14T02:00:00Z'))).toBe(2)
  })
})
