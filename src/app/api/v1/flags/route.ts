import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { getFlagDetails } from '@/lib/flags/flag-server'
import type { ApiResponse } from '@/types'
import type { FlagCategoryWithFlags } from '@/types/flag-config'

/**
 * GET /api/v1/flags
 * - No query: all categories with nested flags
 * - ?category=<categoryId>: single category with flags
 */
export async function GET(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const categoryId = request.nextUrl.searchParams.get('category')?.trim() || undefined

    const result = await getFlagDetails(idToken, businessId, categoryId)

    if (categoryId) {
      const response: ApiResponse<FlagCategoryWithFlags> = {
        data: result as FlagCategoryWithFlags,
      }
      return NextResponse.json(response)
    }

    const response: ApiResponse<FlagCategoryWithFlags[]> = {
      data: result as FlagCategoryWithFlags[],
    }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/flags', 'Failed to load flag details')
  }
}
