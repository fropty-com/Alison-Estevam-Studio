import { describe, it, expect } from 'vitest'
import { timeToMinutes, minutesToPx, layoutColumns, HOUR_HEIGHT } from './dayGridLayout'

describe('timeToMinutes', () => {
  it('converts HH:mm to minutes since midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
})

describe('minutesToPx', () => {
  it('scales minutes to pixels using HOUR_HEIGHT', () => {
    expect(minutesToPx(60)).toBe(HOUR_HEIGHT)
    expect(minutesToPx(30)).toBe(HOUR_HEIGHT / 2)
    expect(minutesToPx(0)).toBe(0)
  })
})

describe('layoutColumns', () => {
  it('gives every item a single column when nothing overlaps', () => {
    const layout = layoutColumns([
      { id: 'a', startMin: 540, endMin: 600 },  // 09:00-10:00
      { id: 'b', startMin: 600, endMin: 660 },  // 10:00-11:00 (touches but doesn't overlap)
    ])
    expect(layout.get('a')).toEqual({ col: 0, cols: 1 })
    expect(layout.get('b')).toEqual({ col: 0, cols: 1 })
  })

  it('splits two overlapping items into two side-by-side columns', () => {
    const layout = layoutColumns([
      { id: 'a', startMin: 540, endMin: 630 },  // 09:00-10:30
      { id: 'b', startMin: 570, endMin: 660 },  // 09:30-11:00 (overlaps a)
    ])
    expect(layout.get('a')?.cols).toBe(2)
    expect(layout.get('b')?.cols).toBe(2)
    expect(layout.get('a')?.col).not.toBe(layout.get('b')?.col)
  })

  it('reuses a freed column once an earlier item in the cluster ends', () => {
    // a: 09:00-09:30, b: 09:15-09:45 (overlaps a), c: 09:30-10:00 (only overlaps b, not a)
    const layout = layoutColumns([
      { id: 'a', startMin: 540, endMin: 570 },
      { id: 'b', startMin: 555, endMin: 585 },
      { id: 'c', startMin: 570, endMin: 600 },
    ])
    // a and c never overlap directly, so c can reuse column 0 once a ends at 570
    expect(layout.get('a')?.col).toBe(0)
    expect(layout.get('c')?.col).toBe(0)
    expect(layout.get('b')?.col).toBe(1)
    expect(layout.get('a')?.cols).toBe(2)
  })

  it('keeps separate non-overlapping clusters independent', () => {
    const layout = layoutColumns([
      { id: 'a', startMin: 540, endMin: 570 },  // 09:00-09:30
      { id: 'b', startMin: 555, endMin: 600 },  // 09:15-10:00 (overlaps a — cluster 1)
      { id: 'c', startMin: 900, endMin: 960 },  // 15:00-16:00 (isolated — cluster 2)
    ])
    expect(layout.get('a')?.cols).toBe(2)
    expect(layout.get('b')?.cols).toBe(2)
    expect(layout.get('c')?.cols).toBe(1)
  })
})
