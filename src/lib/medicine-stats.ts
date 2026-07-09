import type { Medicine } from '@/types'

export function computeMedicinePageStats(medicines: Medicine[]) {
  const active = medicines.filter((medicine) => {
    const status = (medicine.status ?? '').toLowerCase()
    return status !== 'archived' && status !== 'inactive'
  }).length

  return {
    total: medicines.length,
    active,
    withPotencies: medicines.filter((m) => (m.potencies ?? []).length > 0).length,
    withSymptoms: medicines.filter((m) => (m.symptoms ?? []).length > 0).length,
  }
}

/** @deprecated Use computeMedicinePageStats */
export const computeClassPageStats = computeMedicinePageStats
