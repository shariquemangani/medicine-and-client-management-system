import { NextRequest, NextResponse } from 'next/server'
import { fetchPatientRecords } from '@/lib/firebase/firestore-rest'
import { ApiAuthError, requireApiIdToken } from '@/lib/api/require-api-id-token'
import { filterPatientsByTableSearch } from '@/lib/patients/patient-directory-search'
import { paginate } from '@/lib/list-utils'
import type { PaginatedResponse, Patient } from '@/types'

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
    const classId = searchParams.get('classId')?.trim() || undefined
    const status = searchParams.get('status')?.trim() || undefined
    const yearParam = searchParams.get('year')
    const year = yearParam ? Number(yearParam) : undefined

    let result = await fetchPatientRecords(idToken, businessId)

    if (classId) result = result.filter((s) => s.classId === classId)
    if (status) result = result.filter((s) => s.status === status)
    if (year && Number.isFinite(year)) result = result.filter((s) => s.year === year)

    result = filterPatientsByTableSearch(result, search)

    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const paged = paginate(result, page, limit)
    const response: PaginatedResponse<Patient> = {
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
    console.error('[GET /api/v1/patients/list]', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
