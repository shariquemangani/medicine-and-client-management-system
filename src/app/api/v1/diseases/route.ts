import { NextRequest, NextResponse } from 'next/server'
import { createDisease, fetchDiseases } from '@/lib/diseases/disease-server'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse } from '@/types'
import type { Disease } from '@/types/disease'

export async function GET(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const diseases = await fetchDiseases(idToken, businessId)
    const response: ApiResponse<Disease[]> = { data: diseases }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[GET /api/v1/diseases]', error)
    return NextResponse.json({ error: 'Failed to load diseases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { name } = (await request.json()) as { name?: string }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Disease name is required' }, { status: 400 })
    }
    const disease = await createDisease(idToken, businessId, name)
    const response: ApiResponse<Disease> = { data: disease }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[POST /api/v1/diseases]', error)
    return NextResponse.json({ error: 'Failed to create disease' }, { status: 400 })
  }
}
