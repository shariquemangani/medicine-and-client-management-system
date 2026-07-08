export interface TimetableSlot {
  day: string
  startTime: string
  endTime: string
  subject: string
}

export type MedicineStatus = string

/**
 * Clinical vault medicine.
 * Primary fields follow Add Medicine section order:
 * 1. Identity & form → 2. Potencies → 3. Symptoms & information → 4. Antidotes & cautions
 */
export interface Medicine {
  id: string

  // 1. Identity & form
  name: string
  commonName?: string
  formType?: string
  /** Flag-driven status value (label/value from Status category). */
  status?: MedicineStatus

  // 2. Potencies
  potencies?: string[]

  // 3. Symptoms & information
  symptoms?: string[]
  information?: string

  // 4. Antidotes & cautions
  antidotes?: string
  cautionNotes?: string

  /** Legacy / extended fields — kept for older Firestore documents. */
  abbreviation?: string
  categoryId?: string
  categoryName?: string
  sourceType?: string
  kingdom?: string
  description?: string
  keynotes?: string
  mentalSymptoms?: string
  physicalSymptoms?: string
  modalitiesBetter?: string
  modalitiesWorse?: string
  complementaryRemedies?: string
  incompatibleRemedies?: string
  repertoryRubrics?: string
  dosageNotes?: string
  grade?: string
  section?: string
  homeroomStaffId?: string
  homeroomStaffName?: string
  patientIds?: string[]
  subjectStaffIds?: string[]
  scheduleSummary?: string
  timetable?: TimetableSlot[]

  createdAt: string
  updatedAt: string
}

/** Create payload — vault fields only, section order. */
export interface MedicineCreateInput {
  name: string
  commonName: string
  formType: string
  status: MedicineStatus
  potencies: string[]
  symptoms: string[]
  information: string
  antidotes: string
  cautionNotes: string
}

/** Vault fields plus optional legacy roster fields for older screens. */
export type MedicineUpdateInput = Partial<MedicineCreateInput> &
  Partial<
    Pick<
      Medicine,
      'patientIds' | 'subjectStaffIds' | 'timetable' | 'homeroomStaffId' | 'scheduleSummary'
    >
  >

export interface MedicineFormValues {
  // 1. Identity & form
  name: string
  commonName: string
  formType: string
  status: MedicineStatus
  // 2. Potencies
  potencies: string[]
  // 3. Symptoms & information
  symptoms: string[]
  information: string
  // 4. Antidotes & cautions
  antidotes: string
  cautionNotes: string
}
