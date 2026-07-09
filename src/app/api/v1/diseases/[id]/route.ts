import { NextRequest, NextResponse } from 'next/server'
import { deleteDisease, fetchDiseaseById, updateDisease } from '@/lib/diseases/disease-server'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse } from '@/types'
import type { Disease, DiseaseCreateInput } from '@/types/disease'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { id } = await context.params

    const disease = await fetchDiseaseById(idToken, businessId, id)
    if (!disease) {
      return NextResponse.json({ error: 'Disease not found' }, { status: 404 })
    }

    const response: ApiResponse<Disease> = { data: disease }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[GET /api/v1/diseases/[id]]', error)
    return NextResponse.json({ error: 'Failed to load disease' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { id } = await context.params
    const body = (await request.json()) as DiseaseCreateInput

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Disease name is required' }, { status: 400 })
    }

    const disease = await updateDisease(idToken, businessId, id, {
      name: body.name.trim(),
      symptoms: body.symptoms,
      cure: body.cure,
      diet: body.diet,
      precautions: body.precautions,
    })

    const response: ApiResponse<Disease> = { data: disease }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message === 'Disease not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('[PATCH /api/v1/diseases/[id]]', error)
    return NextResponse.json({ error: 'Failed to update disease' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { id } = await context.params

    const disease = await fetchDiseaseById(idToken, businessId, id)
    if (!disease) {
      return NextResponse.json({ error: 'Disease not found' }, { status: 404 })
    }

    await deleteDisease(idToken, businessId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[DELETE /api/v1/diseases/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete disease' }, { status: 500 })
  }
}
