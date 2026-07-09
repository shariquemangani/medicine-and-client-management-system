import { NextRequest, NextResponse } from 'next/server'
import { fetchMedicineRecord } from '@/lib/firebase/firestore-rest'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import type { ApiResponse, Medicine } from '@/types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { id } = await context.params

    const medicine = await fetchMedicineRecord(idToken, businessId, id)
    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    const response: ApiResponse<Medicine> = { data: medicine }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[GET /api/v1/medicines/[id]]', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
