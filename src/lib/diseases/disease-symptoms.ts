import type { MedicineFlagOption } from '@/data/medicine-flag-fields'

export function resolveSymptomLabel(
  value: string,
  options: Pick<MedicineFlagOption, 'value' | 'label'>[]
): string {
  const trimmed = value.trim()
  if (!trimmed) return value

  const byValue = options.find((o) => o.value === trimmed)
  if (byValue) return byValue.label

  const byLabel = options.find((o) => o.label === trimmed)
  if (byLabel) return byLabel.label

  return trimmed
}

export function resolveSymptomLabels(
  symptoms: string[] | undefined,
  options: Pick<MedicineFlagOption, 'value' | 'label'>[]
): string[] {
  if (!symptoms?.length) return []
  return symptoms.map((value) => resolveSymptomLabel(value, options))
}
