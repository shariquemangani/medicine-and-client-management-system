export interface MedicineCategory {
  id: string
  name: string
  labelKey: string
}

/** Default patient medicine categories for clinic workflows. */
export const DEFAULT_MEDICINE_CATEGORIES: MedicineCategory[] = [
  { id: 'general', name: 'General', labelKey: 'patients.categories.general' },
  { id: 'acute', name: 'Acute Care', labelKey: 'patients.categories.acute' },
  { id: 'chronic', name: 'Chronic Care', labelKey: 'patients.categories.chronic' },
  { id: 'pediatric', name: 'Pediatric', labelKey: 'patients.categories.pediatric' },
  { id: 'dermatology', name: 'Skin & Hair', labelKey: 'patients.categories.dermatology' },
  { id: 'respiratory', name: 'Respiratory', labelKey: 'patients.categories.respiratory' },
  { id: 'digestive', name: 'Digestive', labelKey: 'patients.categories.digestive' },
  { id: 'women', name: "Women's Health", labelKey: 'patients.categories.women' },
]

export const DEFAULT_MEDICINE_CATEGORY_ID = DEFAULT_MEDICINE_CATEGORIES[0]?.id ?? 'general'

export function getMedicineCategoryById(id: string): MedicineCategory | undefined {
  return DEFAULT_MEDICINE_CATEGORIES.find((category) => category.id === id)
}

export function getMedicineCategoryName(id: string): string | undefined {
  return getMedicineCategoryById(id)?.name
}
