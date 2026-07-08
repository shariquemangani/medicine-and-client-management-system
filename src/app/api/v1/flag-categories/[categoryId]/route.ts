import { NextRequest, NextResponse } from 'next/server'
import { ApiAuthError, requireAuthenticatedIdToken } from '@/lib/api/require-api-id-token'
import { updateFlagCategory } from '@/lib/flags/flag-server'
import type { ApiResponse } from '@/types'
import type { FlagCategory } from '@/types/flag-config'

type RouteContext = { params: Promise<{ categoryId: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { categoryId } = await context.params
    const { idToken } = await requireAuthenticatedIdToken(request)
    const { name } = (await request.json()) as { name?: string }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    const category = await updateFlagCategory(idToken, categoryId, name)
    const response: ApiResponse<FlagCategory> = { data: category }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[PUT /api/v1/flag-categories/:id]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update category' },
      { status: 400 }
    )
  }
}
