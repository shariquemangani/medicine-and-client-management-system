import { NextRequest, NextResponse } from 'next/server'
import { ApiAuthError, requireAuthenticatedIdToken } from '@/lib/api/require-api-id-token'
import { createFlag, createFlags, listFlagsForCategory } from '@/lib/flags/flag-server'
import type { ApiResponse } from '@/types'
import type { FlagBulkCreateInput, FlagItem, FlagItemInput } from '@/types/flag-config'

type RouteContext = { params: Promise<{ categoryId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { categoryId } = await context.params
    const { idToken } = await requireAuthenticatedIdToken(request)
    const flags = await listFlagsForCategory(idToken, categoryId)
    const response: ApiResponse<FlagItem[]> = { data: flags }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[GET /api/v1/flag-categories/:id/flags]', error)
    return NextResponse.json({ error: 'Failed to load flags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { categoryId } = await context.params
    const { idToken } = await requireAuthenticatedIdToken(request, { resource: 'medicines', action: 'create' })
    const body = (await request.json()) as FlagBulkCreateInput & FlagItemInput

    const labels =
      Array.isArray(body.labels) && body.labels.length > 0
        ? body.labels
        : body.label
          ? [body.label]
          : []

    if (labels.every((label) => !String(label ?? '').trim())) {
      return NextResponse.json({ error: 'At least one flag label is required' }, { status: 400 })
    }

    if (labels.length === 1) {
      const flag = await createFlag(idToken, categoryId, {
        label: String(labels[0]),
      })
      const response: ApiResponse<FlagItem[]> = { data: [flag] }
      return NextResponse.json(response, { status: 201 })
    }

    const flags = await createFlags(idToken, categoryId, labels.map(String))
    const response: ApiResponse<FlagItem[]> = { data: flags }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[POST /api/v1/flag-categories/:id/flags]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create flag' },
      { status: 400 }
    )
  }
}
