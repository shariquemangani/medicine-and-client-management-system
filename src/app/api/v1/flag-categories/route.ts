import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { createFlagCategory, listFlagCategories } from '@/lib/flags/flag-server'
import { flagCategoryInputSchema } from '@/lib/schemas/api-schemas'
import type { ApiResponse } from '@/types'
import type { FlagCategory } from '@/types/flag-config'

export async function GET(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const categories = await listFlagCategories(idToken, businessId)
    const response: ApiResponse<FlagCategory[]> = { data: categories }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/flag-categories', 'Failed to load categories')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request, { resource: 'medicines', action: 'create' })
    const { name } = await parseJsonBody(request, flagCategoryInputSchema)
    const category = await createFlagCategory(idToken, businessId, name)
    const response: ApiResponse<FlagCategory> = { data: category }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'POST /api/v1/flag-categories', 'Failed to create category')
  }
}
