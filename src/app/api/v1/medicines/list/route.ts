import { NextRequest, NextResponse } from 'next/server'
import { fetchMedicineRecords } from '@/lib/firebase/firestore-rest'
import { filterMedicinesByTableSearch } from '@/lib/medicines/medicine-directory-search'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import { paginate } from '@/lib/list-utils'
import type { Medicine, PaginatedResponse } from '@/types'

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

export async function GET(request: NextRequest) {
  try {
    const { idToken, businessId } = await requireApiIdToken(request)
    const { searchParams } = request.nextUrl

    const page = parsePositiveInt(searchParams.get('page'), 1)
    const limit = parsePositiveInt(searchParams.get('limit'), 10)
    const search = searchParams.get('search')?.trim() || undefined
    const status = searchParams.get('status')?.trim() || undefined
    const formType = searchParams.get('formType')?.trim() || undefined

    let result = await fetchMedicineRecords(idToken, businessId)

    if (status) {
      result = result.filter(
        (medicine) => (medicine.status ?? '').toLowerCase() === status.toLowerCase()
      )
    }
    if (formType) {
      result = result.filter(
        (medicine) => (medicine.formType ?? '').toLowerCase() === formType.toLowerCase()
      )
    }

    result = filterMedicinesByTableSearch(result, search)
    result.sort((a, b) => a.name.localeCompare(b.name))

    const paged = paginate(result, page, limit)
    const response: PaginatedResponse<Medicine> = {
      data: paged.data,
      meta: {
        total: paged.total,
        page: paged.page,
        limit: paged.limit,
        totalPages: paged.totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[GET /api/v1/medicines/list]', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
