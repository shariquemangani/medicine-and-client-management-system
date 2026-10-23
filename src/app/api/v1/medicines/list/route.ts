import { NextRequest, NextResponse } from 'next/server'
import {
  countFirestoreDocuments,
  fetchFirestoreCollectionPage,
  fetchMedicineRecords,
} from '@/lib/firebase/firestore-rest'
import { filterMedicinesByTableSearch } from '@/lib/medicines/medicine-directory-search'
import { errorResponse } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { paginate } from '@/lib/list-utils'
import type { Medicine, PaginatedResponse } from '@/types'

/** Hard ceiling on rows per request (one Firestore list page). */
const MAX_LIMIT = 300

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
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 10), MAX_LIMIT)
    const search = searchParams.get('search')?.trim() || undefined
    const status = searchParams.get('status')?.trim() || undefined
    const formType = searchParams.get('formType')?.trim() || undefined

    // Unfiltered first page: read only that page and count server-side (cost follows page size).
    if (!search && !status && !formType && page === 1) {
      const collectionPath = `businesses/${businessId}/medicines`
      const [rows, total] = await Promise.all([
        fetchFirestoreCollectionPage<Medicine>(collectionPath, idToken, { pageSize: limit, orderBy: 'name' }),
        countFirestoreDocuments(collectionPath, idToken),
      ])
      // Documents missing the sort field are skipped by Firestore ordering; if any were, fall through to the full read.
      if (rows.length >= Math.min(total, limit)) {
        const response: PaginatedResponse<Medicine> = {
          data: rows,
          meta: { total, page: 1, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
        }
        return NextResponse.json(response)
      }
    }

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
    return errorResponse(error, 'GET /api/v1/medicines/list', 'Request failed')
  }
}
