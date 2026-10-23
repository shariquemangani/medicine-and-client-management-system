import { NextRequest, NextResponse } from 'next/server'
import {
  deletePatientRecord,
  fetchPatientProfileDetail,
  updatePatientRecord,
} from '@/lib/patients/patient-server'
import { parsePatientUpdateBody } from '@/lib/patients/patient-profile-detail'
import { DomainError, errorResponse } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { safeSegment } from '@/lib/api/path-segment'
import type { ApiResponse } from '@/types'
import type { PatientProfileData, PatientProfileUpdateBody } from '@/types/patient-profile'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const id = safeSegment((await context.params).id)

    const profile = await fetchPatientProfileDetail(idToken, businessId, id)
    const response: ApiResponse<PatientProfileData> = { data: profile }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/patients/[id]', 'Request failed')
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'patients', action: 'edit' })
    const id = safeSegment((await context.params).id)
    const body = (await request.json().catch(() => null)) as PatientProfileUpdateBody | null
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new DomainError('Request body must be a JSON object')
    }
    const updateInput = parsePatientUpdateBody(body)

    if (Object.keys(updateInput).length === 0) {
      throw new DomainError('No update fields provided')
    }

    // Unknown fields are dropped and the patient ID is immutable (see sanitizePatientUpdate).
    await updatePatientRecord(idToken, businessId, id, updateInput)
    const profile = await fetchPatientProfileDetail(idToken, businessId, id)
    const response: ApiResponse<PatientProfileData> = { data: profile }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'PUT /api/v1/patients/[id]', 'Failed to update patient')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'patients', action: 'delete' })
    const id = safeSegment((await context.params).id)
    await deletePatientRecord(idToken, businessId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, 'DELETE /api/v1/patients/[id]', 'Failed to delete patient')
  }
}
