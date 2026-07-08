const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

export function getMonthOptions() {
  return MONTHS.map((m) => ({ value: m.value, label: m.label }))
}

export function parseIsoDateParts(value?: string) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return null
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!y || !m || !d) return null
  return { year: y, month: m, day: d }
}

export function buildIsoDate(year: number, month: number, day: number) {
  const safeYear = Math.max(1, year)
  const safeMonth = Math.min(12, Math.max(1, month))
  const maxDay = getDaysInMonth(safeYear, safeMonth)
  const safeDay = Math.min(maxDay, Math.max(1, day))
  return `${String(safeYear).padStart(4, '0')}-${String(safeMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function getDayOptions(year: number, month: number) {
  const total = getDaysInMonth(year, month)
  return Array.from({ length: total }, (_, i) => {
    const day = i + 1
    return { value: String(day).padStart(2, '0'), label: String(day) }
  })
}

export function todayIsoDate() {
  const now = new Date()
  return buildIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function isTodayIsoDate(value?: string) {
  if (!value) return false
  const parsed = parseIsoDateParts(value)
  if (!parsed) return value === todayIsoDate()
  return buildIsoDate(parsed.year, parsed.month, parsed.day) === todayIsoDate()
}
