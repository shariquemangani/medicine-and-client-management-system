import {
  getPatientRegistrationDefaults,
  getDefaultMedicineRow,
  registrationToPatientCreateInput,
  type PatientRegistrationFormValues,
} from '../src/lib/patient-registration-schema'
import {
  normalizePatientCreateInput,
  orderPatientCreatePayload,
  validatePatientCreateInput,
} from '../src/lib/patients/patient-create-input'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const REGISTRATION_SECTION_KEYS = [
  // 1. Patient details
  ['admissionDate', 'firstName', 'lastName', 'phone', 'address', 'dateOfBirth', 'guardian', 'parents', 'rollNumber', 'email', 'year', 'status'],
  // 2. Consultation
  ['diseases', 'diseaseLabels', 'disease', 'prescription'],
  // 3. Medicines
  ['prescribedMedicines'],
  // 4. Diet
  ['dietPlan'],
  // 5. Additional notes
  ['additionalNotes'],
  // 6. Fees from patient
  ['fees'],
] as const

const REGISTRATION_PAYLOAD_KEY_ORDER = [...REGISTRATION_SECTION_KEYS.flat(), 'notes', 'classId'] as const

function fullRegistrationValues(
  overrides: Partial<PatientRegistrationFormValues> = {}
): PatientRegistrationFormValues {
  return {
    ...getPatientRegistrationDefaults(),
    visitDate: '2026-07-07',
    patientName: 'Rahul Sharma',
    contact: '+919876543210',
    address: '12 MG Road, Pune',
    diseases: ['fever'],
    prescription: 'Rest and hydration',
    medicines: [
      {
        ...getDefaultMedicineRow(),
        medicineIds: ['med-1'],
        medicineNames: ['Paracetamol'],
        formType: 'tablet',
        quantity: '1',
        frequency: 'twice_daily',
        timing: 'after_food',
      },
    ],
    dietItems: [{ item: 'Warm water', amount: '3 times daily' }],
    additionalNotes: 'Follow up in one week',
    patientFees: '500',
    ...overrides,
  }
}

function verifySectionKeyOrder(keys: string[]) {
  assert(
    keys.join(',') === REGISTRATION_PAYLOAD_KEY_ORDER.join(','),
    'POST payload keys must follow sections 1–6 order'
  )
}

function verifyFullRegistrationPayload() {
  const diseaseOptions = [{ value: 'fever', label: 'Fever' }]
  const raw = registrationToPatientCreateInput(fullRegistrationValues(), diseaseOptions)
  const normalized = normalizePatientCreateInput(raw)

  verifySectionKeyOrder(Object.keys(raw))
  verifySectionKeyOrder(Object.keys(normalized))

  assert(raw.admissionDate === '2026-07-07', 'Section 1: visit date → admissionDate')
  assert(/^202607\d{3}$/.test(raw.rollNumber ?? ''), 'Section 1: roll number uses YYYYMM + serial')
  assert(raw.firstName === 'Rahul', 'Section 1: patient name split')
  assert(raw.phone === '+919876543210', 'Section 1: contact')
  assert(raw.address === '12 MG Road, Pune', 'Section 1: address')

  assert(raw.diseases?.length === 1 && raw.diseases[0] === 'fever', 'Section 2: diseases')
  assert(raw.diseaseLabels?.[0] === 'Fever', 'Section 2: disease labels')
  assert(raw.disease === 'Fever', 'Section 2: disease summary')
  assert(raw.prescription === 'Rest and hydration', 'Section 2: prescription')

  assert(raw.prescribedMedicines?.length === 1, 'Section 3: medicines count')
  assert(raw.prescribedMedicines?.[0].medicineNames[0] === 'Paracetamol', 'Section 3: medicine name')

  assert(raw.dietPlan?.length === 1, 'Section 4: diet items')
  assert(raw.dietPlan?.[0].item === 'Warm water', 'Section 4: diet item')

  assert(raw.additionalNotes === 'Follow up in one week', 'Section 5: additional notes')

  assert(raw.fees === '500', 'Section 6: fees from patient')

  assert(Boolean(raw.notes?.includes('1. Patient details')), 'Summary includes section 1')
  assert(Boolean(raw.notes?.includes('6. Fees from patient')), 'Summary includes section 6')
  assert(Boolean(raw.notes?.includes('₹500.00')), 'Summary includes formatted fee')

  assert(validatePatientCreateInput(normalized) === null, 'Normalized payload should validate')
}

function verifyEmptyOptionalSections() {
  const payload = registrationToPatientCreateInput(
    fullRegistrationValues({
      dietItems: [],
      additionalNotes: '',
      patientFees: '',
    })
  )

  assert(Array.isArray(payload.dietPlan) && payload.dietPlan.length === 0, 'Section 4: empty diet array')
  assert(payload.additionalNotes === '', 'Section 5: empty additional notes')
  assert(payload.fees === '0', 'Section 6: fees default to 0 when empty')
}

function verifyOrderHelperPreservesSequence() {
  const shuffled = {
    fees: '100',
    classId: 'general',
    notes: 'test',
    dietPlan: [],
    disease: 'Cold',
    firstName: 'A',
    lastName: 'B',
    rollNumber: 'MF-1',
    email: 'a@b.local',
    phone: '',
    address: '',
    dateOfBirth: '2026-01-01',
    admissionDate: '2026-01-01',
    year: 2026,
    status: 'active' as const,
    guardian: { name: 'A B', phone: '', relation: 'Self' },
    diseases: ['cold'],
    diseaseLabels: ['Cold'],
    prescription: '',
    prescribedMedicines: [{ medicineIds: ['m1'], medicineNames: ['Med'], formType: '', quantity: '' }],
    additionalNotes: '',
  }

  const ordered = orderPatientCreatePayload(shuffled)
  verifySectionKeyOrder(Object.keys(ordered))
}

verifyFullRegistrationPayload()
verifyEmptyOptionalSections()
verifyOrderHelperPreservesSequence()

console.log('verify-registration-payload: all checks passed')
