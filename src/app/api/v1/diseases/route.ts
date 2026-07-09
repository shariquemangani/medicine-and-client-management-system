import { NextRequest, NextResponse } from 'next/server'
import { createDisease, fetchDiseases } from '@/lib/diseases/disease-server'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse } from '@/types'
import type { Disease, DiseaseCreateInput } from '@/types/disease'

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
    const body = (await request.json()) as DiseaseCreateInput
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Disease name is required' }, { status: 400 })
    }
    const disease = await createDisease(idToken, businessId, {
      name: body.name.trim(),
      symptoms: body.symptoms,
      cure: body.cure,
      diet: body.diet,
      precautions: body.precautions,
    })
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
