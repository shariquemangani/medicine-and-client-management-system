import { NextRequest, NextResponse } from 'next/server'
import { ApiAuthError, requireAuthenticatedIdToken } from '@/lib/api/require-api-id-token'
import { createFlagCategory, listFlagCategories } from '@/lib/flags/flag-server'
import type { ApiResponse } from '@/types'
import type { FlagCategory } from '@/types/flag-config'

export async function GET(request: NextRequest) {
  try {
    const { idToken } = await requireAuthenticatedIdToken(request)
    const categories = await listFlagCategories(idToken)
    const response: ApiResponse<FlagCategory[]> = { data: categories }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[GET /api/v1/flag-categories]', error)
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await requireAuthenticatedIdToken(request, { resource: 'medicines', action: 'create' })
    const { name } = (await request.json()) as { name?: string }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    const category = await createFlagCategory(idToken, name)
    const response: ApiResponse<FlagCategory> = { data: category }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[POST /api/v1/flag-categories]', error)
    if (error instanceof Error && /already exists/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 400 })
  }
}
