import type { Medicine, MedicineCreateInput, MedicineFormValues } from '@/types/medicine'

export function emptyMedicineFormValues(): MedicineFormValues {
  return {
    // 1. Identity & form
    name: '',
    commonName: '',
    formType: '',
    status: '',
    // 2. Potencies
    potencies: [],
    // 3. Symptoms & information
    symptoms: [],
    information: '',
    // 4. Antidotes & cautions
    antidotes: '',
    cautionNotes: '',
  }
}

function legacySymptoms(medicine: Medicine): string[] {
  const raw = medicine.symptoms as string[] | string | undefined
  if (Array.isArray(raw)) {
    return raw.filter((s) => s.trim()).map((s) => s.trim())
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const parts = [medicine.mentalSymptoms, medicine.physicalSymptoms, medicine.keynotes]
    .map((v) => v?.trim())
    .filter(Boolean) as string[]
  return parts
}

export function medicineToFormValues(medicine: Medicine): MedicineFormValues {
  return {
    name: medicine.name ?? '',
    commonName: medicine.commonName ?? '',
    formType: medicine.formType ?? '',
    status: medicine.status ?? '',
    potencies: medicine.potencies?.length ? [...medicine.potencies] : [],
    symptoms: legacySymptoms(medicine),
    information: medicine.information ?? medicine.scheduleSummary ?? '',
    antidotes: medicine.antidotes ?? '',
    cautionNotes: medicine.cautionNotes ?? '',
  }
}

/** Builds create/update payload in Add Medicine section order. */
export function formValuesToMedicineCreateInput(
  values: MedicineFormValues
): MedicineCreateInput {
  return {
    // 1. Identity & form
    name: values.name.trim(),
    commonName: values.commonName.trim(),
    formType: values.formType,
    status: values.status,
    // 2. Potencies
    potencies: [...values.potencies],
    // 3. Symptoms & information
    symptoms: values.symptoms.map((s) => s.trim()).filter(Boolean),
    information: values.information.trim(),
    // 4. Antidotes & cautions
    antidotes: values.antidotes.trim(),
    cautionNotes: values.cautionNotes.trim(),
  }
}

export function getMedicineInformation(medicine: Medicine): string {
  return (
    medicine.information?.trim() ||
    medicine.scheduleSummary?.trim() ||
    getMedicineSymptoms(medicine).join(', ') ||
    medicine.description?.trim() ||
    medicine.keynotes?.trim() ||
    ''
  )
}

export function getMedicineInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'M'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function getMedicineSymptoms(medicine: Medicine): string[] {
  return legacySymptoms(medicine)
}
