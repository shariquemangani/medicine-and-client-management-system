import type { Medicine } from '@/types/medicine'

function medicineSearchHaystack(medicine: Medicine): string {
  return [
    medicine.name,
    medicine.commonName,
    medicine.formType,
    medicine.status,
    medicine.information,
    medicine.abbreviation,
    medicine.categoryName,
    medicine.keynotes,
    medicine.scheduleSummary,
    ...(medicine.symptoms ?? []),
    ...(medicine.potencies ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterMedicinesByTableSearch(
  medicines: Medicine[],
  search?: string
): Medicine[] {
  const query = search?.trim().toLowerCase()
  if (!query) return medicines
  return medicines.filter((medicine) => medicineSearchHaystack(medicine).includes(query))
}
