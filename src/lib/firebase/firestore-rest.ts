import type { Medicine, Patient } from '@/types'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } }

function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) }
    return { doubleValue: value }
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeFirestoreValue) } }
  }
  if (typeof value === 'object') {
    const fields = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        encodeFirestoreValue(nested),
      ])
    )
    return { mapValue: { fields } }
  }
  return { stringValue: String(value) }
}

export function encodeFirestoreFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encodeFirestoreValue(value)])
  )
}

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  if ('mapValue' in value) {
    const fields = value.mapValue.fields ?? {}
    return Object.fromEntries(
      Object.entries(fields).map(([key, nested]) => [key, decodeFirestoreValue(nested)])
    )
  }
  if ('arrayValue' in value) {
    return (value.arrayValue.values ?? []).map(decodeFirestoreValue)
  }
  return null
}

function decodeFirestoreDocument(
  doc: { name: string; fields?: Record<string, FirestoreValue> },
  idFromName = true
): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(doc.fields ?? {})) {
    data[key] = decodeFirestoreValue(value)
  }
  if (idFromName) {
    const segments = doc.name.split('/')
    data.id = segments[segments.length - 1]
  }
  return data
}

const REQUEST_TIMEOUT_MS = 8000

/** Thrown for any non-2xx Firestore REST response, so callers can tell 404/403 from outages. */
export class FirestoreHttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'FirestoreHttpError'
    this.status = status
  }
}

function documentsUrl(path: string, query = '') {
  if (!PROJECT_ID) {
    throw new Error('Firebase project ID is not configured')
  }
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}${query}`
}

async function firestoreFetch(path: string, idToken: string, query = '') {
  const res = await fetch(documentsUrl(path, query), {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    documents?: { name: string; fields?: Record<string, FirestoreValue> }[]
    fields?: Record<string, FirestoreValue>
    name?: string
    nextPageToken?: string
  }

  if (!res.ok) {
    throw new FirestoreHttpError(res.status, body.error?.message ?? `Firestore request failed (${res.status})`)
  }

  return body
}

async function firestoreMutate(
  path: string,
  idToken: string,
  method: 'PATCH' | 'POST',
  body: Record<string, unknown>,
  query = ''
) {
  const res = await fetch(documentsUrl(path, query), {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const responseBody = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    name?: string
    fields?: Record<string, FirestoreValue>
  }

  if (!res.ok) {
    throw new FirestoreHttpError(res.status, responseBody.error?.message ?? `Firestore write failed (${res.status})`)
  }

  return responseBody
}

export async function deleteFirestoreDocument(documentPath: string, idToken: string) {
  const res = await fetch(documentsUrl(documentPath), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new FirestoreHttpError(res.status, body.error?.message ?? `Firestore delete failed (${res.status})`)
  }
}

export async function createFirestoreDocument<T extends object>(
  documentPath: string,
  idToken: string,
  data: T
) {
  const segments = documentPath.split('/')
  const documentId = segments.pop()!
  const parentPath = segments.join('/')

  return firestoreMutate(
    `${parentPath}?documentId=${encodeURIComponent(documentId)}`,
    idToken,
    'POST',
    { fields: encodeFirestoreFields(data as Record<string, unknown>) }
  )
}

/** Wraps a top-level field name in backticks so characters like `.` or `&` cannot change the mask. */
function quoteFieldPath(path: string) {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(path)) return path
  const escaped = path.replaceAll('\\', '\\\\').replaceAll('`', '\\`')
  return '`' + escaped + '`'
}

export async function patchFirestoreDocument<T extends object>(
  documentPath: string,
  idToken: string,
  data: T
) {
  const fieldPaths = Object.keys(data)
  const query =
    fieldPaths.length > 0
      ? `?${fieldPaths.map((path) => `updateMask.fieldPaths=${encodeURIComponent(quoteFieldPath(path))}`).join('&')}`
      : ''

  return firestoreMutate(
    documentPath,
    idToken,
    'PATCH',
    { fields: encodeFirestoreFields(data as Record<string, unknown>) },
    query
  )
}

export async function fetchFirestoreCollection<T extends { id: string }>(
  collectionPath: string,
  idToken: string
): Promise<T[]> {
  // The REST list endpoint returns one page per call; follow nextPageToken so
  // collections larger than a single page are not silently truncated.
  const results: T[] = []
  let pageToken: string | undefined
  do {
    const query = `?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    const body = await firestoreFetch(collectionPath, idToken, query)
    for (const doc of body.documents ?? []) results.push(decodeFirestoreDocument(doc) as T)
    pageToken = body.nextPageToken
  } while (pageToken)
  return results
}

/** One bounded page of a collection (newest first by default): reads at most `pageSize` documents. */
export async function fetchFirestoreCollectionPage<T extends { id: string }>(
  collectionPath: string,
  idToken: string,
  options: { pageSize: number; orderBy?: string }
): Promise<T[]> {
  const params = [`pageSize=${Math.min(Math.max(options.pageSize, 1), 300)}`]
  if (options.orderBy) params.push(`orderBy=${encodeURIComponent(options.orderBy)}`)
  const body = await firestoreFetch(collectionPath, idToken, `?${params.join('&')}`)
  return (body.documents ?? []).map((doc) => decodeFirestoreDocument(doc) as T)
}

function splitCollectionPath(collectionPath: string) {
  const segments = collectionPath.split('/')
  const collectionId = segments.pop() as string
  return { parent: segments.join('/'), collectionId }
}

async function firestorePost<T>(path: string, idToken: string, body: unknown): Promise<T> {
  const res = await fetch(documentsUrl(path), {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const json = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    // runQuery reports failures as a one-element array.
    const errorBody = (Array.isArray(json) ? json[0] : json) as { error?: { message?: string } } | null
    const message = errorBody?.error?.message
    throw new FirestoreHttpError(res.status, message ?? `Firestore query failed (${res.status})`)
  }
  return json as T
}

/** Documents of a collection where `field == value` (single-field equality needs no index). */
export async function queryFirestoreEquals<T extends { id: string }>(
  collectionPath: string,
  idToken: string,
  field: string,
  value: string
): Promise<T[]> {
  const { parent, collectionId } = splitCollectionPath(collectionPath)
  const rows = await firestorePost<{ document?: { name: string; fields?: Record<string, FirestoreValue> } }[]>(
    `${parent}:runQuery`,
    idToken,
    {
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
      },
    }
  )
  return rows.filter((row) => row.document).map((row) => decodeFirestoreDocument(row.document!) as T)
}

/** Largest string value of `field` that starts with `prefix` (one document read, single-field index). */
export async function queryLastWithPrefix(
  collectionPath: string,
  idToken: string,
  field: string,
  prefix: string
): Promise<string | null> {
  const { parent, collectionId } = splitCollectionPath(collectionPath)
  const asValue = (text: string): FirestoreValue => ({ stringValue: text })
  const rows = await firestorePost<{ document?: { name: string; fields?: Record<string, FirestoreValue> } }[]>(
    `${parent}:runQuery`,
    idToken,
    {
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              { fieldFilter: { field: { fieldPath: field }, op: 'GREATER_THAN_OR_EQUAL', value: asValue(prefix) } },
              { fieldFilter: { field: { fieldPath: field }, op: 'LESS_THAN', value: asValue(prefix + '\uffff') } },
            ],
          },
        },
        orderBy: [{ field: { fieldPath: field }, direction: 'DESCENDING' }],
        limit: 1,
      },
    }
  )
  const doc = rows.find((row) => row.document)?.document
  if (!doc) return null
  const value = decodeFirestoreDocument(doc)[field]
  return typeof value === 'string' ? value : null
}

/** Server-side document count (billed as one read per 1,000 index entries, not per document). */
export async function countFirestoreDocuments(collectionPath: string, idToken: string): Promise<number> {
  const { parent, collectionId } = splitCollectionPath(collectionPath)
  const rows = await firestorePost<{ result?: { aggregateFields?: { total?: { integerValue?: string } } } }[]>(
    `${parent}:runAggregationQuery`,
    idToken,
    {
      structuredAggregationQuery: {
        structuredQuery: { from: [{ collectionId }] },
        aggregations: [{ alias: 'total', count: {} }],
      },
    }
  )
  return Number(rows[0]?.result?.aggregateFields?.total?.integerValue ?? 0)
}

export async function fetchFirestoreDocument<T extends { id: string }>(
  documentPath: string,
  idToken: string
): Promise<T | null> {
  try {
    const body = await firestoreFetch(documentPath, idToken)
    if (!body.name || !body.fields) return null
    return decodeFirestoreDocument({ name: body.name, fields: body.fields }) as T
  } catch (error) {
    // Missing or not readable (rules) means "no document"; outages and timeouts must surface.
    if (error instanceof FirestoreHttpError && (error.status === 404 || error.status === 403)) return null
    throw error
  }
}

export async function fetchPatientRecords(idToken: string, businessId: string): Promise<Patient[]> {
  return fetchFirestoreCollection<Patient>(`businesses/${businessId}/patients`, idToken)
}

export async function fetchMedicineRecords(
  idToken: string,
  businessId: string
): Promise<Medicine[]> {
  return fetchFirestoreCollection<Medicine>(`businesses/${businessId}/medicines`, idToken)
}

export async function fetchMedicineRecord(
  idToken: string,
  businessId: string,
  medicineId: string
): Promise<Medicine | null> {
  return fetchFirestoreDocument<Medicine>(
    `businesses/${businessId}/medicines/${medicineId}`,
    idToken
  )
}

export async function fetchPatientRecord(
  idToken: string,
  businessId: string,
  patientId: string
): Promise<Patient | null> {
  return fetchFirestoreDocument<Patient>(`businesses/${businessId}/patients/${patientId}`, idToken)
}

export interface ApiUserProfile {
  businessId: string
  role?: string
  isActive?: boolean
}

export async function fetchApiUserProfile(idToken: string, uid: string): Promise<ApiUserProfile | null> {
  const profile = await fetchFirestoreDocument<{
    id: string
    businessId?: string
    role?: string
    isActive?: boolean
  }>(`users/${uid}`, idToken)
  if (!profile) return null
  return {
    businessId: profile.businessId ?? profile.id,
    role: profile.role,
    isActive: profile.isActive,
  }
}

export async function fetchUserBusinessId(idToken: string, uid: string): Promise<string | null> {
  const profile = await fetchFirestoreDocument<{ id: string; businessId?: string }>(
    `users/${uid}`,
    idToken
  )
  if (!profile) return null
  return profile.businessId ?? profile.id
}
