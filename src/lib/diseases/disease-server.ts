import {
  createFirestoreDocument,
  fetchFirestoreCollection,
} from '@/lib/firebase/firestore-rest'
import { generateId } from '@/lib/list-utils'
import type { Disease } from '@/types/disease'

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function fetchDiseases(idToken: string, businessId: string): Promise<Disease[]> {
  const rows = await fetchFirestoreCollection<Disease>(
    `businesses/${businessId}/diseases`,
    idToken
  )
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createDisease(
  idToken: string,
  businessId: string,
  name: string
): Promise<Disease> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Disease name is required')
  }

  const existing = await fetchDiseases(idToken, businessId)
  const found = existing.find((d) => d.name.toLowerCase() === trimmed.toLowerCase())
  if (found) return found

  const id = generateId(slugify(trimmed) || 'disease')
  const now = new Date().toISOString()
  const disease: Disease = { id, name: trimmed, createdAt: now }

  await createFirestoreDocument(
    `businesses/${businessId}/diseases/${id}`,
    idToken,
    disease as unknown as Record<string, unknown>
  )
  return disease
}
