import { NextRequest, NextResponse } from 'next/server'
import { createPatientRecord } from '@/lib/patients/patient-server'
import {
  normalizePatientCreateInput,
  validatePatientCreateInput,
} from '@/lib/patients/patient-create-input'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse, PatientCreateInput } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const body = normalizePatientCreateInput((await request.json()) as PatientCreateInput)

    const validationError = validatePatientCreateInput(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const patient = await createPatientRecord(idToken, businessId, body)
    const response: ApiResponse<typeof patient> = { data: patient }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[POST /api/v1/patients]', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 400 })
  }
}
