export function paginate<T>(
  items: T[],
  page = 1,
  limit = 10
): { data: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  return {
    data: items.slice(start, start + limit),
    total,
    page: safePage,
    limit,
    totalPages,
  }
}

export function filterBySearch<T>(
  items: T[],
  search: string | undefined,
  fields: (keyof T)[]
): T[] {
  if (!search?.trim()) return items
  const q = search.toLowerCase()
  return items.filter((item) =>
    fields.some((field) => String(item[field] ?? '').toLowerCase().includes(q))
  )
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
