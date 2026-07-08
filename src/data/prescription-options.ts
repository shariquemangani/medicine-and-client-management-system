export const MEDICINE_VOLUME_UNITS = [
  { value: 'ml', label: 'ML' },
  { value: 'ltr', label: 'LTR' },
] as const

export type MedicineVolumeUnit = (typeof MEDICINE_VOLUME_UNITS)[number]['value']

export function getMedicineVolumeUnitLabel(value: string): string {
  return MEDICINE_VOLUME_UNITS.find((u) => u.value === value)?.label ?? value.toUpperCase()
}

export const MEDICINE_FORM_TYPES = [
  { value: 'drops', label: 'Drops' },
  { value: 'tabs', label: 'Tabs' },
  { value: 'creams', label: 'Creams' },
  { value: 'oil', label: 'Oil' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'globules', label: 'Globules' },
  { value: 'trituration', label: 'Trituration' },
  { value: 'syrup', label: 'Syrup' },
] as const

export type MedicineFormType = (typeof MEDICINE_FORM_TYPES)[number]['value']

/** Form types that use a numeric quantity input */
export const NUMERIC_QUANTITY_FORM_TYPES: MedicineFormType[] = [
  'drops',
  'tabs',
  'trituration',
  'globules',
]

export const FREQUENCY_OPTIONS = [
  { value: 'once_morning', label: 'Once in morning' },
  { value: 'once_afternoon', label: 'Once in afternoon' },
  { value: 'once_evening', label: 'Once in evening' },
  { value: 'once_night', label: 'Once in night' },
  { value: 'twice_daily', label: '2 times a day' },
  { value: 'thrice_daily', label: '3 times a day' },
  { value: 'once_week', label: 'Once in a week' },
  { value: 'once_month', label: 'Once in a month' },
  { value: 'other', label: 'Other' },
] as const

export const TIMING_OPTIONS = [
  { value: 'empty_stomach', label: 'Empty stomach' },
  { value: 'before_bed', label: 'Before bed' },
  { value: '30_min_before_meal', label: '30 min before meal' },
  { value: '15_min_before_meal', label: '15 min before meal' },
  { value: 'immediately_after_meal', label: 'Immediately after meal' },
  { value: '15_after_meal', label: '15 min after meal' },
  { value: '30_after_meal', label: '30 min after meal' },
  { value: 'other', label: 'Other' },
] as const

export const OTHER_OPTION = 'other'

export function getFormTypeLabel(value: string): string {
  return MEDICINE_FORM_TYPES.find((t) => t.value === value)?.label ?? value
}

export function getFrequencyLabel(value: string, other?: string): string {
  if (value === OTHER_OPTION && other?.trim()) return other.trim()
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function getTimingLabel(value: string, other?: string): string {
  if (value === OTHER_OPTION && other?.trim()) return other.trim()
  return TIMING_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function usesNumericQuantity(formType: string): boolean {
  return NUMERIC_QUANTITY_FORM_TYPES.includes(formType as MedicineFormType)
}
