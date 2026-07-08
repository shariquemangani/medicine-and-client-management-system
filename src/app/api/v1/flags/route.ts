import { NextRequest, NextResponse } from 'next/server'
import { ApiAuthError, requireAuthenticatedIdToken } from '@/lib/api/require-api-id-token'
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
    const { idToken } = await requireAuthenticatedIdToken(request)
    const categoryId = request.nextUrl.searchParams.get('category')?.trim() || undefined

    const result = await getFlagDetails(idToken, categoryId)

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
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message === 'Category not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('[GET /api/v1/flags]', error)
    return NextResponse.json({ error: 'Failed to load flag details' }, { status: 500 })
  }
}
