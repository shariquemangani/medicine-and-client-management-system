import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { deleteFlag, updateFlag } from '@/lib/flags/flag-server'
import { flagUpdateSchema } from '@/lib/schemas/api-schemas'
import { safeSegment } from '@/lib/api/path-segment'
import type { ApiResponse } from '@/types'
import type { FlagItem } from '@/types/flag-config'

type RouteContext = { params: Promise<{ categoryId: string; flagId: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const categoryId = safeSegment(params.categoryId)
    const flagId = safeSegment(params.flagId)
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'edit' })
    const body = await parseJsonBody(request, flagUpdateSchema)
    const flag = await updateFlag(idToken, businessId, categoryId, flagId, { label: body.label })
    const response: ApiResponse<FlagItem> = { data: flag }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'PUT /api/v1/flag-categories/:id/flags/:flagId', 'Failed to update flag')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const categoryId = safeSegment(params.categoryId)
    const flagId = safeSegment(params.flagId)
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'delete' })
    await deleteFlag(idToken, businessId, categoryId, flagId)
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return errorResponse(error, 'DELETE /api/v1/flag-categories/:id/flags/:flagId', 'Failed to delete flag')
  }
}
