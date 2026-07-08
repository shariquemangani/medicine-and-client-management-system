import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a person name to title case (e.g. "john doe" → "John Doe"). */
export function formatPersonName(name: string): string {
  if (!name?.trim()) return ''
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const PLACEHOLDER_NUTRITIONIST_NAMES = new Set([
  'dr. anjali menon',
  'dr. amrita singh',
  'dr. anusha, msc rd',
])

/** Returns true when the name is empty or a legacy mock placeholder. */
export function isPlaceholderNutritionistName(name?: string): boolean {
  if (!name?.trim()) return true
  return PLACEHOLDER_NUTRITIONIST_NAMES.has(name.trim().toLowerCase())
}

/** Prefers logged-in name over empty or placeholder saved values. */
export function resolveNutritionistName(
  savedName: string | undefined,
  loggedInName: string
): string {
  if (loggedInName && isPlaceholderNutritionistName(savedName)) {
    return loggedInName
  }
  if (savedName?.trim()) return formatPersonName(savedName)
  return loggedInName
}

/** Formats API date strings (e.g. "2026-02-25") for E-signed display. */
export function formatConclusionDate(date?: string): string {
  if (!date?.trim()) return ''
  const trimmed = date.trim()
  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? trimmed
  const parsed = new Date(
    isoDate.includes('T') ? trimmed : `${isoDate}T00:00:00`
  )
  if (Number.isNaN(parsed.getTime())) return trimmed
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Picks conclusion/eSignature block from summary or report payload. */
export function extractConclusionSource(source?: Record<string, any> | null) {
  if (!source) return {}
  if (source.conclusion) return source.conclusion
  if (source.conclusionSignature) return source.conclusionSignature
  if (source.eSignature) return source.eSignature
  if (source.date || source.signature || source.nutritionistName) return source
  return {}
}

/** Resolves raw API date string (yyyy-MM-dd) for consult summary reports. */
export function resolveConsultSummaryApiDateRaw(
  source?: Record<string, any> | null,
  options?: { reportDate?: string; createdAt?: string }
): string | undefined {
  const raw = extractConclusionSource(source)
  const candidates = [
    raw.date,
    source?.date,
    options?.reportDate,
    source?.reportDate,
    options?.createdAt,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const iso = candidate.trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
      return iso || candidate.trim()
    }
  }

  return undefined
}

/** API date for consult summary, or today (yyyy-MM-dd) when missing. */
export function resolveConsultSummaryReportDate(
  source?: Record<string, any> | null,
  options?: { reportDate?: string; createdAt?: string }
): string {
  return (
    resolveConsultSummaryApiDateRaw(source, options) ||
    new Date().toISOString().slice(0, 10)
  )
}

/** Resolves the best available date from API summary / eSignature fields. */
export function resolveConclusionApiDate(
  source?: Record<string, any> | null,
  options?: { apiReportDate?: string }
): string {
  const raw = extractConclusionSource(source)
  const candidates = [
    raw.date,
    source?.date,
    options?.apiReportDate,
    source?.reportDate,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return formatConclusionDate(candidate)
    }
  }

  return ''
}

/** Normalizes API conclusion/eSignature fields for ConclusionSignature UI. */
export function normalizeConclusionInitialData(
  source?: Record<string, any> | null,
  options?: {
    loggedInNutritionistName?: string
    apiDateOnly?: boolean
    apiReportDate?: string
  }
) {
  const raw = extractConclusionSource(source)
  const loggedIn = options?.loggedInNutritionistName || ''
  const apiDate = resolveConclusionApiDate(source, {
    apiReportDate: options?.apiReportDate,
  })
  const todayFormatted = formatConclusionDate(
    new Date().toISOString().slice(0, 10)
  )

  return {
    signature: raw.signature || '/images/common/signature.png',
    date: apiDate || todayFormatted,
    nutritionistName: resolveNutritionistName(raw.nutritionistName, loggedIn),
    title:
      raw.title ||
      raw.qualification ||
      raw.nutritionQualification ||
      'RD, MSc Clinical Nutrition',
    qualification:
      raw.qualification || raw.nutritionQualification || raw.title || '',
  }
}
