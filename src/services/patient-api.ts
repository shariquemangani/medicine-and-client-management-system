import { getFirebaseIdToken } from '@/lib/firebase/id-token'
import type {
  ApiResponse,
  PaginatedResponse,
  Patient,
  PatientCreateInput,
  PatientUpdateInput,
} from '@/types'
import type { PatientProfileData, PatientProfileUpdateBody } from '@/types/patient-profile'

const PATIENTS_API = '/api/v1/patients'
const PATIENTS_LIST_API = '/api/v1/patients/list'

export interface FetchPatientsListParams {
  search?: string
  classId?: string
  status?: string
  year?: number
  page?: number
  limit?: number
}


async function patientApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const idToken = await getFirebaseIdToken()
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  })

  const body = (await res.json().catch(() => ({}))) as T & { error?: string }

  if (!res.ok) {
    throw new Error(body.error ?? 'Request failed')
  }

  return body
}

function buildPatientsListQuery(params?: FetchPatientsListParams) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search?.trim()) query.set('search', params.search.trim())
  if (params?.classId) query.set('classId', params.classId)
  if (params?.status) query.set('status', params.status)
  if (params?.year) query.set('year', String(params.year))
  return query
}

export async function fetchPatientsList(
  params?: FetchPatientsListParams
): Promise<PaginatedResponse<Patient>> {
  const query = buildPatientsListQuery(params)
  const url = query.size > 0 ? `${PATIENTS_LIST_API}?${query}` : PATIENTS_LIST_API
  const body = await patientApiFetch<PaginatedResponse<Patient>>(url)

  if (!Array.isArray(body.data) || !body.meta) {
    throw new Error('Invalid patients list response')
  }

  return body
}

export async function createPatientApi(data: PatientCreateInput): Promise<Patient> {
  const body = await patientApiFetch<ApiResponse<Patient>>(PATIENTS_API, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!body.data) {
    throw new Error('Invalid create patient response')
  }

  return body.data
}

export async function fetchPatientProfileApi(id: string): Promise<PatientProfileData> {
  const body = await patientApiFetch<ApiResponse<PatientProfileData>>(
    `${PATIENTS_API}/${id}?profile=true`
  )

  if (!body.data?.header?.id) {
    throw new Error('Invalid patient profile response')
  }

  return body.data
}

export async function updatePatientApi(
  id: string,
  data: PatientUpdateInput | PatientProfileUpdateBody
): Promise<PatientProfileData> {
  const body = await patientApiFetch<ApiResponse<PatientProfileData>>(`${PATIENTS_API}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (!body.data?.header?.id) {
    throw new Error('Invalid update patient response')
  }

  return body.data
}

export async function deletePatientApi(id: string): Promise<void> {
  await patientApiFetch<{ success?: boolean }>(`${PATIENTS_API}/${id}`, {
    method: 'DELETE',
  })
}
