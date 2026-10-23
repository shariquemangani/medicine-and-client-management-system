import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { updateFlagCategory } from '@/lib/flags/flag-server'
import { flagCategoryInputSchema } from '@/lib/schemas/api-schemas'
import { safeSegment } from '@/lib/api/path-segment'
import type { ApiResponse } from '@/types'
import type { FlagCategory } from '@/types/flag-config'

type RouteContext = { params: Promise<{ categoryId: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const categoryId = safeSegment((await context.params).categoryId)
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'edit' })
    const { name } = await parseJsonBody(request, flagCategoryInputSchema)
    const category = await updateFlagCategory(idToken, businessId, categoryId, name)
    const response: ApiResponse<FlagCategory> = { data: category }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'PUT /api/v1/flag-categories/:id', 'Failed to update category')
  }
}
