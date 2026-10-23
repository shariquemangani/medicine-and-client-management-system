import { NextRequest, NextResponse } from 'next/server'
import { deleteDisease, fetchDiseaseById, updateDisease } from '@/lib/diseases/disease-server'
import { DomainError, errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { diseaseInputSchema } from '@/lib/schemas/api-schemas'
import { safeSegment } from '@/lib/api/path-segment'
import type { ApiResponse } from '@/types'
import type { Disease } from '@/types/disease'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const id = safeSegment((await context.params).id)

    const disease = await fetchDiseaseById(idToken, businessId, id)
    if (!disease) throw new DomainError('Disease not found', 404)

    const response: ApiResponse<Disease> = { data: disease }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/diseases/[id]', 'Failed to load disease')
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'edit' })
    const id = safeSegment((await context.params).id)
    const body = await parseJsonBody(request, diseaseInputSchema)

    const disease = await updateDisease(idToken, businessId, id, body)
    const response: ApiResponse<Disease> = { data: disease }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'PATCH /api/v1/diseases/[id]', 'Failed to update disease')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'delete' })
    const id = safeSegment((await context.params).id)

    const disease = await fetchDiseaseById(idToken, businessId, id)
    if (!disease) throw new DomainError('Disease not found', 404)

    await deleteDisease(idToken, businessId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, 'DELETE /api/v1/diseases/[id]', 'Failed to delete disease')
  }
}
