import { z } from 'zod'
import { isValidMobileNumber, parsePhoneValue } from '@/lib/phone-utils'
import { splitPatientName } from '@/lib/patient-form-schema'
import { orderPatientCreatePayload } from '@/lib/patients/patient-create-input'
import { buildPatientRollNumber } from '@/lib/patients/patient-roll-number'
import { todayIsoDate } from '@/lib/date-select-utils'
import {
  getFormTypeLabel,
  getFrequencyLabel,
  getMedicineVolumeUnitLabel,
  getTimingLabel,
  usesNumericQuantity,
} from '@/data/prescription-options'
import type { PatientCreateInput, PatientDietItem, PatientPrescribedMedicine } from '@/types'

const medicineRowSchema = z.object({
  medicineIds: z.array(z.string()),
  medicineNames: z.array(z.string()),
  medicineQuantityMl: z.string().optional(),
  medicineQuantityUnit: z.enum(['ml', 'ltr']).optional(),
  formType: z.string().optional(),
  quantity: z.string().optional(),
  quantityOther: z.string().optional(),
  frequency: z.string().optional(),
  frequencyOther: z.string().optional(),
  timing: z.string().optional(),
  timingOther: z.string().optional(),
})

const dietRowSchema = z.object({
  item: z.string(),
  amount: z.string(),
})

export const clientRegistrationSchema = z.object({
  visitDate: z.string().min(1, 'Date is required'),
  patientName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  contact: z
    .string()
    .refine((value) => {
      if (!value.trim()) return true
      const { countryCode, number } = parsePhoneValue(value)
      return isValidMobileNumber(countryCode, number)
    }, 'Enter a valid mobile number'),
  address: z.string().max(300),
  diseases: z.array(z.string()).min(1, 'Select at least one disease'),
  prescription: z.string().max(500),
  medicines: z
    .array(medicineRowSchema)
    .min(1, 'Add at least one medicine')
    .superRefine((rows, ctx) => {
      rows.forEach((row, index) => {
        if (row.medicineIds.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Medicine name is required',
            path: [index, 'medicineIds'],
          })
        }
      })
    }),
  dietItems: z.array(dietRowSchema),
  additionalNotes: z.string().max(500),
  patientFees: z
    .string()
    .refine(
      (value) => !value.trim() || /^\d+(\.\d{1,2})?$/.test(value.trim()),
      'Enter a valid fee amount'
    ),
})

export type PatientRegistrationFormValues = z.infer<typeof clientRegistrationSchema>

export function getDefaultMedicineRow(): PatientRegistrationFormValues['medicines'][number] {
  return {
    medicineIds: [],
    medicineNames: [],
    medicineQuantityMl: '',
    medicineQuantityUnit: 'ml',
    formType: '',
    quantity: '',
    quantityOther: '',
    frequency: '',
    frequencyOther: '',
    timing: '',
    timingOther: '',
  }
}

export function getPatientRegistrationDefaults(): PatientRegistrationFormValues {
  return {
    visitDate: todayIsoDate(),
    patientName: '',
    contact: '',
    address: '',
    diseases: [],
    prescription: '',
    medicines: [getDefaultMedicineRow()],
    dietItems: [],
    additionalNotes: '',
    patientFees: '',
  }
}

function buildRollNumber(visitDate: string): string {
  return buildPatientRollNumber(visitDate)
}

export function formatMedicineDosage(row: PatientRegistrationFormValues['medicines'][number]): string {
  const names = row.medicineNames.join(', ')
  const form = row.formType ? getFormTypeLabel(row.formType) : ''
  const qty = row.formType
    ? usesNumericQuantity(row.formType)
      ? row.quantity
      : row.quantityOther
    : ''
  const parts = [
    names,
    row.medicineQuantityMl?.trim()
      ? `${row.medicineQuantityMl.trim()} ${getMedicineVolumeUnitLabel(row.medicineQuantityUnit ?? 'ml')}`
      : '',
    form,
    qty ? `Qty: ${qty}` : '',
  ]
  if (row.frequency) {
    parts.push(getFrequencyLabel(row.frequency, row.frequencyOther))
  }
  if (row.timing) {
    parts.push(getTimingLabel(row.timing, row.timingOther))
  }
  return parts.filter(Boolean).join(' · ')
}

function toPrescribedMedicine(
  row: PatientRegistrationFormValues['medicines'][number]
): PatientPrescribedMedicine {
  return {
    medicineIds: row.medicineIds,
    medicineNames: row.medicineNames,
    medicineQuantityMl: row.medicineQuantityMl?.trim() || undefined,
    medicineQuantityUnit: row.medicineQuantityUnit ?? 'ml',
    formType: row.formType ?? '',
    quantity: row.quantity ?? '',
    quantityOther: row.quantityOther?.trim() || undefined,
    frequency: row.frequency || undefined,
    frequencyOther: row.frequencyOther?.trim() || undefined,
    timing: row.timing || undefined,
    timingOther: row.timingOther?.trim() || undefined,
    dosage: formatMedicineDosage(row),
  }
}

function toDietPlan(items: PatientRegistrationFormValues['dietItems']): PatientDietItem[] {
  return items
    .map((item) => ({
      item: item.item.trim(),
      amount: item.amount.trim(),
    }))
    .filter((item) => item.item && item.amount)
}

function hasMedicineRowData(row: PatientRegistrationFormValues['medicines'][number]): boolean {
  return (
    row.medicineIds.length > 0 ||
    Boolean(row.formType?.trim()) ||
    Boolean(row.quantity?.trim()) ||
    Boolean(row.quantityOther?.trim()) ||
    Boolean(row.medicineQuantityMl?.trim())
  )
}

function formatPatientFee(value: string): string {
  const num = Number(value.trim())
  if (!value.trim() || Number.isNaN(num)) return '0.00'
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Human-readable notes mirroring form section order (1–6). */
export function buildClinicalNotes(
  values: PatientRegistrationFormValues,
  diseaseLabels: string[]
): string {
  const medicineLines = values.medicines
    .filter(hasMedicineRowData)
    .map((m) => `• ${formatMedicineDosage(m)}`)
    .join('\n')
  const visitDate = values.visitDate.trim() || todayIsoDate()
  const patientName = values.patientName.trim()
  const contact = values.contact.trim()
  const address = values.address.trim()
  const dietLines = values.dietItems
    .filter((d) => d.item.trim() && d.amount.trim())
    .map((d) => `• ${d.item.trim()} — ${d.amount.trim()}`)
    .join('\n')

  const sections = [
    [
      '1. Patient details',
      `Visit date: ${visitDate}`,
      patientName ? `Name: ${patientName}` : '',
      contact ? `Contact: ${contact}` : '',
      address ? `Address: ${address}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    diseaseLabels.length || values.prescription.trim()
      ? [
          '2. Consultation',
          diseaseLabels.length ? `Diseases: ${diseaseLabels.join(', ')}` : '',
          values.prescription.trim() ? `Prescription: ${values.prescription.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '',
    medicineLines ? ['3. Medicines', medicineLines].join('\n') : '',
    dietLines ? ['4. Diet', dietLines].join('\n') : '',
    values.additionalNotes.trim()
      ? ['5. Additional notes', values.additionalNotes.trim()].join('\n')
      : '',
    values.patientFees.trim()
      ? ['6. Fees from patient', `Amount: ₹${formatPatientFee(values.patientFees)}`].join('\n')
      : '',
  ].filter(Boolean)

  return sections.join('\n\n')
}

/**
 * Maps the 6 registration form sections into POST /api/v1/patients payload fields
 * in the same order: patient → consultation → medicines → diet → additional notes → fees.
 */
export function registrationToPatientCreateInput(
  values: PatientRegistrationFormValues,
  diseaseOptions: { value: string; label: string }[] = []
): PatientCreateInput {
  const diseaseLabelMap = Object.fromEntries(diseaseOptions.map((o) => [o.value, o.label]))
  const visitDate = values.visitDate.trim() || todayIsoDate()
  const patientName = values.patientName.trim() || 'Patient'
  const { firstName: splitFirst, lastName } = splitPatientName(patientName)
  const firstName = splitFirst || 'Patient'
  const rollNumber = buildRollNumber(visitDate)
  const year = Number(visitDate.slice(0, 4)) || new Date().getFullYear()
  const diseaseLabels = values.diseases.map((id) => diseaseLabelMap[id] ?? id)
  const diseaseSummary = diseaseLabels.join(', ')
  const prescribedMedicines = values.medicines.filter(hasMedicineRowData).map(toPrescribedMedicine)
  const dietPlan = toDietPlan(values.dietItems)
  const contact = values.contact.trim()
  const address = values.address.trim()

  const payload: PatientCreateInput = {
    // 1. Patient details
    admissionDate: visitDate,
    firstName,
    lastName,
    phone: contact,
    address,
    dateOfBirth: visitDate,
    guardian: {
      name: patientName,
      phone: contact,
      relation: 'Self',
    },
    parents: {
      fatherName: patientName,
      fatherAadhar: '000000000000',
      fatherMobile: contact,
      motherName: '',
      motherAadhar: '',
      motherMobile: '',
    },
    rollNumber,
    email: `${rollNumber.toLowerCase()}@patient.local`,
    year,
    status: 'active',

    // 2. Consultation
    diseases: [...values.diseases],
    diseaseLabels,
    disease: diseaseSummary,
    prescription: values.prescription.trim(),

    // 3. Medicines
    prescribedMedicines,

    // 4. Diet
    dietPlan,

    // 5. Additional notes
    additionalNotes: values.additionalNotes.trim(),

    // 6. Fees from patient
    fees: values.patientFees.trim() || '0',

    // Combined clinical summary (sections 1–6)
    notes: buildClinicalNotes(values, diseaseLabels),

    // System / legacy fields
    classId: 'general',
  }

  return orderPatientCreatePayload(payload)
}

export function isMedicineRegistration(data: PatientCreateInput): boolean {
  return Boolean(data.disease?.trim() && data.prescription?.trim())
}
