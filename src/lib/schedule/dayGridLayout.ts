// Pure layout math for the admin day-grid — no React, easy to test in isolation.

/** Pixels per hour on the grid. 15-min gridlines are HOUR_HEIGHT / 4. */
export const HOUR_HEIGHT = 64

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT
}

export interface GridItem {
  id: string
  startMin: number
  endMin: number
}

export interface GridPosition {
  col: number
  cols: number
}

/**
 * Assigns each item a column index and the total column count of its
 * overlap cluster, so overlapping appointments render side by side instead
 * of stacking on top of each other. Non-overlapping items always get cols=1.
 */
export function layoutColumns(items: GridItem[]): Map<string, GridPosition> {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin)
  const layout = new Map<string, GridPosition>()

  let cluster: GridItem[] = []
  let clusterEnd = -Infinity

  const flushCluster = () => {
    if (cluster.length === 0) return
    const colEnds: number[] = []
    const colOf = new Map<string, number>()
    for (const it of cluster) {
      let placed = false
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= it.startMin) {
          colOf.set(it.id, c)
          colEnds[c] = it.endMin
          placed = true
          break
        }
      }
      if (!placed) {
        colOf.set(it.id, colEnds.length)
        colEnds.push(it.endMin)
      }
    }
    const cols = colEnds.length
    for (const it of cluster) layout.set(it.id, { col: colOf.get(it.id)!, cols })
    cluster = []
    clusterEnd = -Infinity
  }

  for (const it of sorted) {
    if (cluster.length > 0 && it.startMin >= clusterEnd) flushCluster()
    cluster.push(it)
    clusterEnd = Math.max(clusterEnd, it.endMin)
  }
  flushCluster()

  return layout
}
