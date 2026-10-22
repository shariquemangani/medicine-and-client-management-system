import { NextRequest, NextResponse } from 'next/server'
import { ApiAuthError, requireAuthenticatedIdToken } from '@/lib/api/require-api-id-token'
import { deleteFlag, updateFlag } from '@/lib/flags/flag-server'
import type { ApiResponse } from '@/types'
import type { FlagItem, FlagItemInput } from '@/types/flag-config'

type RouteContext = { params: Promise<{ categoryId: string; flagId: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { categoryId, flagId } = await context.params
    const { idToken } = await requireAuthenticatedIdToken(request, { resource: 'medicines', action: 'edit' })
    const body = (await request.json()) as FlagItemInput
    if (!body.label?.trim()) {
      return NextResponse.json({ error: 'Flag label is required' }, { status: 400 })
    }
    const flag = await updateFlag(idToken, categoryId, flagId, {
      label: body.label,
    })
    const response: ApiResponse<FlagItem> = { data: flag }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[PUT /api/v1/flag-categories/:id/flags/:flagId]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update flag' },
      { status: 400 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { categoryId, flagId } = await context.params
    const { idToken } = await requireAuthenticatedIdToken(_request, { resource: 'medicines', action: 'delete' })
    await deleteFlag(idToken, categoryId, flagId)
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[DELETE /api/v1/flag-categories/:id/flags/:flagId]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete flag' },
      { status: 400 }
    )
  }
}
