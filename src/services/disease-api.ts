import { auth } from '@/lib/firebase/app'
import type { ApiResponse } from '@/types'
import type { Disease, DiseaseCreateInput } from '@/types/disease'

const DISEASES_API = '/api/v1/diseases'

async function getFirebaseIdToken() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

async function diseaseApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (!res.ok) throw new Error(body.error ?? 'Request failed')
  return body
}

export async function fetchDiseases(): Promise<Disease[]> {
  const res = await diseaseApiFetch<ApiResponse<Disease[]>>(DISEASES_API)
  return res.data
}

export async function fetchDiseaseById(id: string): Promise<Disease> {
  const res = await diseaseApiFetch<ApiResponse<Disease>>(`${DISEASES_API}/${id}`)
  return res.data
}

export async function createDisease(input: DiseaseCreateInput): Promise<Disease> {
  const res = await diseaseApiFetch<ApiResponse<Disease>>(DISEASES_API, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return res.data
}

export async function updateDisease(id: string, input: DiseaseCreateInput): Promise<Disease> {
  const res = await diseaseApiFetch<ApiResponse<Disease>>(`${DISEASES_API}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return res.data
}

export async function deleteDisease(id: string): Promise<void> {
  await diseaseApiFetch<{ success: boolean }>(`${DISEASES_API}/${id}`, {
    method: 'DELETE',
  })
}
