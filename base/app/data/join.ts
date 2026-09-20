import type { JoinSpec } from '../contracts/spec'

/**
 * Aggregates of one data source folded into the rows of another, so an item
 * template can read `$item.votes` without the spec having to loop twice.
 */
const field = (row: unknown, key: string) => (row as Record<string, unknown>)?.[key]

export function applyJoin(rows: unknown[], join: JoinSpec, other: unknown[]): unknown[] {
  const key = join.key ?? 'id'
  const counts = new Map<unknown, number>()
  const sums = new Map<unknown, number>()
  for (const row of other) {
    const id = field(row, join.on)
    counts.set(id, (counts.get(id) ?? 0) + 1)
    if (join.sum) {
      const value = Number(field(row, join.sum))
      sums.set(id, (sums.get(id) ?? 0) + (Number.isFinite(value) ? value : 0))
    }
  }
  return rows.map((row) => {
    const id = field(row, key)
    const extra: Record<string, unknown> = {}
    if (join.count) {
      extra[join.count] = counts.get(id) ?? 0
    }
    if (join.sum) {
      extra[join.as ?? join.sum] = sums.get(id) ?? 0
    }
    return { ...(row as Record<string, unknown>), ...extra }
  })
}
