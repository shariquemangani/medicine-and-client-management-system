import { NextRequest, NextResponse } from 'next/server'
import { createDisease, fetchDiseases } from '@/lib/diseases/disease-server'
import { errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { diseaseInputSchema } from '@/lib/schemas/api-schemas'
import type { ApiResponse } from '@/types'
import type { Disease } from '@/types/disease'

export async function GET(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const diseases = await fetchDiseases(idToken, businessId)
    const response: ApiResponse<Disease[]> = { data: diseases }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/diseases', 'Failed to load diseases')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'create' })
    const body = await parseJsonBody(request, diseaseInputSchema)
    const disease = await createDisease(idToken, businessId, body)
    const response: ApiResponse<Disease> = { data: disease }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'POST /api/v1/diseases', 'Failed to create disease')
  }
}
