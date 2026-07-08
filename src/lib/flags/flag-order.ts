import type { FlagItem } from '@/types/flag-config'

/** Keep flags in the order they were added (oldest first). */
export function compareFlagsByCreationOrder(a: FlagItem, b: FlagItem): number {
  const byCreated = a.createdAt.localeCompare(b.createdAt)
  if (byCreated !== 0) return byCreated
  return a.id.localeCompare(b.id, undefined, { numeric: true })
}

export function sortFlagsByCreationOrder(flags: FlagItem[]): FlagItem[] {
  return [...flags].sort(compareFlagsByCreationOrder)
}
