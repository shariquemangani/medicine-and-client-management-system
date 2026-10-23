import { NextRequest, NextResponse } from 'next/server'
import { fetchMedicineRecord } from '@/lib/firebase/firestore-rest'
import { DomainError, errorResponse } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { safeSegment } from '@/lib/api/path-segment'
import type { ApiResponse, Medicine } from '@/types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const id = safeSegment((await context.params).id)

    const medicine = await fetchMedicineRecord(idToken, businessId, id)
    if (!medicine) throw new DomainError('Medicine not found', 404)

    const response: ApiResponse<Medicine> = { data: medicine }
    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/medicines/[id]', 'Request failed')
  }
}
