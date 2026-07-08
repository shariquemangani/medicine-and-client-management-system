const CURRENT_YEAR = new Date().getFullYear()

export const MIN_ENROLLMENT_YEAR = 1900
export const MAX_ENROLLMENT_YEAR = CURRENT_YEAR + 5
export const DEFAULT_ENROLLMENT_YEAR = CURRENT_YEAR

/** Enrollment years for selectors: newest first, from MAX down to 1900. */
export function getEnrollmentYearOptions(): number[] {
  const years: number[] = []
  for (let year = MAX_ENROLLMENT_YEAR; year >= MIN_ENROLLMENT_YEAR; year--) {
    years.push(year)
  }
  return years
}

/** Merge API/patient-derived years with the full enrollment year range. */
export function mergeEnrollmentYears(existing: number[] = []): number[] {
  const merged = new Set([...getEnrollmentYearOptions(), ...existing])
  return Array.from(merged)
    .filter((year) => year >= MIN_ENROLLMENT_YEAR && year <= MAX_ENROLLMENT_YEAR)
    .sort((a, b) => b - a)
}
