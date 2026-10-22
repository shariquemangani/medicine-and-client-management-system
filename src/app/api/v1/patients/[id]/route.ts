import { NextRequest, NextResponse } from 'next/server'
import {
  fetchPatientProfileDetail,
  updatePatientRecord,
} from '@/lib/patients/patient-server'
import { parsePatientUpdateBody } from '@/lib/patients/patient-profile-detail'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse } from '@/types'
import type { PatientProfileData, PatientProfileUpdateBody } from '@/types/patient-profile'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { id } = await context.params

    const profile = await fetchPatientProfileDetail(idToken, businessId, id)
    const response: ApiResponse<PatientProfileData> = { data: profile }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message === 'Patient not found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    console.error('[GET /api/v1/patients/[id]]', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'patients', action: 'edit' })
    const { id } = await context.params
    const body = (await request.json()) as PatientProfileUpdateBody
    const updateInput = parsePatientUpdateBody(body)

    if (Object.keys(updateInput).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
    }

    await updatePatientRecord(idToken, businessId, id, updateInput)
    const profile = await fetchPatientProfileDetail(idToken, businessId, id)
    const response: ApiResponse<PatientProfileData> = { data: profile }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message === 'Patient not found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    console.error('[PUT /api/v1/patients/[id]]', error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'patients', action: 'delete' })
    const { id } = await context.params
    const { deletePatientRecord } = await import('@/lib/patients/patient-server')
    await deletePatientRecord(idToken, businessId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message === 'Patient not found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    console.error('[DELETE /api/v1/patients/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 400 })
  }
}
