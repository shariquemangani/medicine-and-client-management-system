import { NextRequest, NextResponse } from 'next/server'
import { createPatientRecord } from '@/lib/patients/patient-server'
import {
  normalizePatientCreateInput,
  validatePatientCreateInput,
} from '@/lib/patients/patient-create-input'
import { DomainError, errorResponse } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse, PatientCreateInput } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'patients', action: 'create' })
    const raw = (await request.json().catch(() => null)) as PatientCreateInput | null
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new DomainError('Request body must be a JSON object')
    }

    let body: PatientCreateInput
    try {
      body = normalizePatientCreateInput(raw)
    } catch {
      // Wrong field types (a string where a list is expected, ...) are the caller's mistake, not ours.
      throw new DomainError('Invalid patient data')
    }

    const validationError = validatePatientCreateInput(body)
    if (validationError) throw new DomainError(validationError)

    const patient = await createPatientRecord(idToken, businessId, body)
    const response: ApiResponse<typeof patient> = { data: patient }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'POST /api/v1/patients', 'Failed to create patient')
  }
}
