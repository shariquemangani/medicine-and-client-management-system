import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { createFlag, createFlags, listFlagsForCategory } from '@/lib/flags/flag-server'
import { flagCreateSchema } from '@/lib/schemas/api-schemas'
import { safeSegment } from '@/lib/api/path-segment'
import type { ApiResponse } from '@/types'
import type { FlagItem } from '@/types/flag-config'

type RouteContext = { params: Promise<{ categoryId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const categoryId = safeSegment((await context.params).categoryId)
    const { idToken, businessId } = await requireApiIdToken(request)
    const flags = await listFlagsForCategory(idToken, businessId, categoryId)
    const response: ApiResponse<FlagItem[]> = { data: flags }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/flag-categories/:id/flags', 'Failed to load flags')
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const categoryId = safeSegment((await context.params).categoryId)
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'create' })
    const body = await parseJsonBody(request, flagCreateSchema)

    const labels = body.labels?.length ? body.labels : body.label ? [body.label] : []

    if (labels.length === 1) {
      const flag = await createFlag(idToken, businessId, categoryId, { label: labels[0] })
      const response: ApiResponse<FlagItem[]> = { data: [flag] }
      return NextResponse.json(response, { status: 201 })
    }

    const flags = await createFlags(idToken, businessId, categoryId, labels)
    const response: ApiResponse<FlagItem[]> = { data: flags }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'POST /api/v1/flag-categories/:id/flags', 'Failed to create flag')
  }
}
