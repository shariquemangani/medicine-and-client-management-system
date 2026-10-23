import { auth } from '@/lib/firebase/app'
import { getFirebaseIdToken } from '@/lib/firebase/id-token'
import type { ApiResponse } from '@/types'
import type { FlagCategory, FlagCategoryWithFlags, FlagItem, FlagItemInput } from '@/types/flag-config'

const CATEGORIES_API = '/api/v1/flag-categories'
const FLAGS_API = '/api/v1/flags'


async function flagApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (init?.method && init.method !== 'GET') invalidateFlagCache()
  if (!res.ok) throw new Error(body.error ?? 'Request failed')
  return body
}

export async function fetchFlagCategories(): Promise<FlagCategory[]> {
  const res = await flagApiFetch<ApiResponse<FlagCategory[]>>(CATEGORIES_API)
  return res.data
}

// The taxonomy rarely changes but every vault/patient screen needs it: share one request per
// user for a few minutes. Every flag mutation below clears it.
const FLAG_CACHE_MS = 10 * 60_000
let flagCache: { uid: string | undefined; at: number; promise: Promise<FlagCategoryWithFlags[]> } | null = null

export function invalidateFlagCache() {
  flagCache = null
}

/** All categories with flags in one request (cached, see above). */
export async function fetchAllFlagDetails(options?: { force?: boolean }): Promise<FlagCategoryWithFlags[]> {
  await auth.authStateReady()
  const uid = auth.currentUser?.uid
  if (!options?.force && flagCache && flagCache.uid === uid && Date.now() - flagCache.at < FLAG_CACHE_MS) {
    return flagCache.promise
  }
  const promise = flagApiFetch<ApiResponse<FlagCategoryWithFlags[]>>(FLAGS_API).then((res) => res.data)
  const entry = { uid, at: Date.now(), promise }
  flagCache = entry
  // A failed request must not be reused.
  promise.catch(() => {
    if (flagCache === entry) flagCache = null
  })
  return promise
}

/** Single category with flags. */
export async function fetchFlagDetailsByCategory(
  categoryId: string
): Promise<FlagCategoryWithFlags> {
  const res = await flagApiFetch<ApiResponse<FlagCategoryWithFlags>>(
    `${FLAGS_API}?category=${encodeURIComponent(categoryId)}`
  )
  return res.data
}

export async function createFlagCategory(name: string): Promise<FlagCategory> {
  const res = await flagApiFetch<ApiResponse<FlagCategory>>(CATEGORIES_API, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return res.data
}

export async function updateFlagCategory(
  categoryId: string,
  name: string
): Promise<FlagCategory> {
  const res = await flagApiFetch<ApiResponse<FlagCategory>>(
    `${CATEGORIES_API}/${categoryId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }
  )
  return res.data
}

export async function fetchFlags(categoryId: string): Promise<FlagItem[]> {
  const res = await flagApiFetch<ApiResponse<FlagItem[]>>(
    `${CATEGORIES_API}/${categoryId}/flags`
  )
  return res.data
}

export async function createFlag(
  categoryId: string,
  input: FlagItemInput
): Promise<FlagItem> {
  const flags = await createFlags(categoryId, [input.label])
  return flags[0]
}

export async function createFlags(
  categoryId: string,
  labels: string[]
): Promise<FlagItem[]> {
  const res = await flagApiFetch<ApiResponse<FlagItem[]>>(
    `${CATEGORIES_API}/${categoryId}/flags`,
    {
      method: 'POST',
      body: JSON.stringify({ labels }),
    }
  )
  return res.data
}

export async function updateFlag(
  categoryId: string,
  flagId: string,
  input: FlagItemInput
): Promise<FlagItem> {
  const res = await flagApiFetch<ApiResponse<FlagItem>>(
    `${CATEGORIES_API}/${categoryId}/flags/${flagId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  )
  return res.data
}

export async function deleteFlag(categoryId: string, flagId: string): Promise<void> {
  await flagApiFetch<{ data: { success: boolean } }>(
    `${CATEGORIES_API}/${categoryId}/flags/${flagId}`,
    { method: 'DELETE' }
  )
}
