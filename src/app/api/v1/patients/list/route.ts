import { NextRequest, NextResponse } from 'next/server'
import {
  countFirestoreDocuments,
  fetchFirestoreCollectionPage,
  fetchPatientRecords,
} from '@/lib/firebase/firestore-rest'
import { errorResponse } from '@/lib/api/api-error'
import { requireApiIdToken } from '@/lib/api/require-api-id-token'
import { filterPatientsByTableSearch } from '@/lib/patients/patient-directory-search'
import { paginate } from '@/lib/list-utils'
import type { PaginatedResponse, Patient } from '@/types'

/**
 * The directory table needs a few columns only. National ID numbers, parents' details, guardian
 * contact, clinical notes and prescriptions stay out of list responses (they are loaded on the
 * patient's own page), which keeps them out of the browser cache and shrinks the payload.
 */
function toListRow(patient: Patient): Patient {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    rollNumber: patient.rollNumber,
    email: patient.email,
    phone: patient.phone,
    classId: patient.classId,
    className: patient.className,
    year: patient.year,
    status: patient.status,
    dateOfBirth: patient.dateOfBirth,
    address: patient.address,
    fees: patient.fees,
    diseases: patient.diseases,
    diseaseLabels: patient.diseaseLabels,
    disease: patient.disease,
    // Required by the Patient type but never shown in the directory.
    guardian: { name: '', phone: '', relation: '' },
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  }
}

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
    const classId = searchParams.get('classId')?.trim() || undefined
    const status = searchParams.get('status')?.trim() || undefined
    const yearParam = searchParams.get('year')
    const year = yearParam ? Number(yearParam) : undefined

    const hasFilter = Boolean(search || classId || status || (year && Number.isFinite(year)))
    const collectionPath = `businesses/${businessId}/patients`

    // Unfiltered request: read only the newest page and count server-side, so the cost follows the
    // page size rather than the size of the clinic. Filters and search still need a full scan.
    if (!hasFilter && page === 1) {
      const [rows, total] = await Promise.all([
        fetchFirestoreCollectionPage<Patient>(collectionPath, idToken, {
          pageSize: limit,
          orderBy: 'createdAt desc',
        }),
        countFirestoreDocuments(collectionPath, idToken),
      ])
      // Documents missing the sort field are skipped by Firestore ordering; if any were, fall through to the full read.
      if (rows.length >= Math.min(total, limit)) {
        const response: PaginatedResponse<Patient> = {
          data: rows.map(toListRow),
          meta: { total, page: 1, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
        }
        return NextResponse.json(response)
      }
    }

    let result = await fetchPatientRecords(idToken, businessId)

    if (classId) result = result.filter((s) => s.classId === classId)
    if (status) result = result.filter((s) => s.status === status)
    if (year && Number.isFinite(year)) result = result.filter((s) => s.year === year)

    result = filterPatientsByTableSearch(result, search)

    result.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

    const paged = paginate(result, page, limit)
    const response: PaginatedResponse<Patient> = {
      data: paged.data.map(toListRow),
      meta: {
        total: paged.total,
        page: paged.page,
        limit: paged.limit,
        totalPages: paged.totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return errorResponse(error, 'GET /api/v1/patients/list', 'Request failed')
  }
}
