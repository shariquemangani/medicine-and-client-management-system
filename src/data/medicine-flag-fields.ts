import type { FlagCategory, FlagItem } from '@/types/flag-config'

export type MedicineFlagFieldKey = 'formType' | 'status' | 'potencies' | 'symptoms'

/** Preferred flag-category names for medicine form fields (case-insensitive match). */
export const MEDICINE_FLAG_CATEGORY_ALIASES: Record<
  MedicineFlagFieldKey,
  readonly string[]
> = {
  formType: ['form type', 'form', 'forms', 'dosage form'],
  status: ['status', 'medicine status'],
  potencies: ['potencies', 'potency', 'dilutions', 'potency list'],
  symptoms: ['symptoms', 'symptom', 'indications', 'clinical symptoms'],
}

export interface MedicineFlagOption {
  id: string
  label: string
  value: string
}

export interface MedicineFlagFieldOptions {
  formType: MedicineFlagOption[]
  status: MedicineFlagOption[]
  potencies: MedicineFlagOption[]
  symptoms: MedicineFlagOption[]
}

export function emptyMedicineFlagFieldOptions(): MedicineFlagFieldOptions {
  return {
    formType: [],
    status: [],
    potencies: [],
    symptoms: [],
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function matchFlagCategory<T extends FlagCategory>(
  categories: T[],
  field: MedicineFlagFieldKey
): T | null {
  const aliases = MEDICINE_FLAG_CATEGORY_ALIASES[field]
  const normalized = categories.map((c) => ({
    category: c,
    name: normalizeName(c.name),
  }))

  for (const alias of aliases) {
    const exact = normalized.find((c) => c.name === alias)
    if (exact) return exact.category
  }

  for (const alias of aliases) {
    const partial = normalized.find(
      (c) => c.name.includes(alias) || alias.includes(c.name)
    )
    if (partial) return partial.category
  }

  return null
}

export function flagsToOptions(flags: FlagItem[]): MedicineFlagOption[] {
  return flags.map((f) => ({
    id: f.id,
    label: f.label,
    value: f.value || f.label,
  }))
}
