import type { Patient } from '@/types'

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

async function firestoreFetch(path: string, idToken: string) {
  if (!PROJECT_ID) {
    throw new Error('Firebase project ID is not configured')
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  })

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    documents?: { name: string; fields?: Record<string, FirestoreValue> }[]
    fields?: Record<string, FirestoreValue>
    name?: string
  }

  if (!res.ok) {
    throw new Error(body.error?.message ?? `Firestore request failed (${res.status})`)
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
  if (!PROJECT_ID) {
    throw new Error('Firebase project ID is not configured')
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}${query}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const responseBody = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    name?: string
    fields?: Record<string, FirestoreValue>
  }

  if (!res.ok) {
    throw new Error(responseBody.error?.message ?? `Firestore write failed (${res.status})`)
  }

  return responseBody
}

export async function deleteFirestoreDocument(documentPath: string, idToken: string) {
  if (!PROJECT_ID) {
    throw new Error('Firebase project ID is not configured')
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${documentPath}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(body.error?.message ?? `Firestore delete failed (${res.status})`)
  }
}

export async function createFirestoreDocument(
  documentPath: string,
  idToken: string,
  data: Record<string, unknown>
) {
  const segments = documentPath.split('/')
  const documentId = segments.pop()!
  const parentPath = segments.join('/')

  return firestoreMutate(
    `${parentPath}?documentId=${encodeURIComponent(documentId)}`,
    idToken,
    'POST',
    { fields: encodeFirestoreFields(data) }
  )
}

export async function patchFirestoreDocument(
  documentPath: string,
  idToken: string,
  data: Record<string, unknown>
) {
  const fieldPaths = Object.keys(data)
  const query =
    fieldPaths.length > 0
      ? `?${fieldPaths.map((path) => `updateMask.fieldPaths=${path}`).join('&')}`
      : ''

  return firestoreMutate(documentPath, idToken, 'PATCH', { fields: encodeFirestoreFields(data) }, query)
}

export async function fetchFirestoreCollection<T extends { id: string }>(
  collectionPath: string,
  idToken: string
): Promise<T[]> {
  const body = await firestoreFetch(collectionPath, idToken)
  return (body.documents ?? []).map((doc) => decodeFirestoreDocument(doc) as T)
}

export async function fetchFirestoreDocument<T extends { id: string }>(
  documentPath: string,
  idToken: string
): Promise<T | null> {
  try {
    const body = await firestoreFetch(documentPath, idToken)
    if (!body.name || !body.fields) return null
    return decodeFirestoreDocument({ name: body.name, fields: body.fields }) as T
  } catch {
    return null
  }
}

export async function fetchPatientRecords(idToken: string, businessId: string): Promise<Patient[]> {
  return fetchFirestoreCollection<Patient>(`businesses/${businessId}/patients`, idToken)
}

export async function fetchPatientRecord(
  idToken: string,
  businessId: string,
  patientId: string
): Promise<Patient | null> {
  return fetchFirestoreDocument<Patient>(`businesses/${businessId}/patients/${patientId}`, idToken)
}

export async function fetchUserBusinessId(idToken: string, uid: string): Promise<string | null> {
  const profile = await fetchFirestoreDocument<{ id: string; businessId?: string }>(
    `users/${uid}`,
    idToken
  )
  if (!profile) return null
  return profile.businessId ?? profile.id
}
