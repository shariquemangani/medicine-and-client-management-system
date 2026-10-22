import { getFirebaseIdToken } from '@/lib/firebase/id-token'
import type { ApiResponse, Medicine, PaginatedResponse } from '@/types'

const MEDICINES_LIST_API = '/api/v1/medicines/list'
const MEDICINES_API = '/api/v1/medicines'

export interface FetchMedicinesListParams {
  search?: string
  status?: string
  formType?: string
  page?: number
  limit?: number
}


async function medicineApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

function buildMedicinesListQuery(params?: FetchMedicinesListParams) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search?.trim()) query.set('search', params.search.trim())
  if (params?.status?.trim()) query.set('status', params.status.trim())
  if (params?.formType?.trim()) query.set('formType', params.formType.trim())
  return query
}

export async function fetchMedicinesList(
  params?: FetchMedicinesListParams
): Promise<PaginatedResponse<Medicine>> {
  const query = buildMedicinesListQuery(params)
  const url = query.size > 0 ? `${MEDICINES_LIST_API}?${query}` : MEDICINES_LIST_API
  const body = await medicineApiFetch<PaginatedResponse<Medicine>>(url)

  if (!Array.isArray(body.data) || !body.meta) {
    throw new Error('Invalid medicines list response')
  }

  return body
}

export async function fetchMedicineById(id: string): Promise<Medicine> {
  const body = await medicineApiFetch<ApiResponse<Medicine>>(`${MEDICINES_API}/${id}`)
  if (!body.data) throw new Error('Medicine not found')
  return body.data
}
