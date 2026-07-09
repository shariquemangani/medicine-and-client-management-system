import {
  createFirestoreDocument,
  deleteFirestoreDocument,
  fetchFirestoreCollection,
  fetchFirestoreDocument,
  patchFirestoreDocument,
} from '@/lib/firebase/firestore-rest'
import { generateId } from '@/lib/list-utils'
import type { Disease, DiseaseCreateInput } from '@/types/disease'

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

export async function fetchDiseaseById(
  idToken: string,
  businessId: string,
  id: string
): Promise<Disease | null> {
  return fetchFirestoreDocument<Disease>(`businesses/${businessId}/diseases/${id}`, idToken)
}

export async function deleteDisease(
  idToken: string,
  businessId: string,
  id: string
): Promise<void> {
  await deleteFirestoreDocument(`businesses/${businessId}/diseases/${id}`, idToken)
}

export async function createDisease(
  idToken: string,
  businessId: string,
  input: DiseaseCreateInput
): Promise<Disease> {
  const trimmed = input.name.trim()
  if (!trimmed) {
    throw new Error('Disease name is required')
  }

  const existing = await fetchDiseases(idToken, businessId)
  const found = existing.find((d) => d.name.toLowerCase() === trimmed.toLowerCase())
  if (found) return found

  const id = generateId(slugify(trimmed) || 'disease')
  const now = new Date().toISOString()
  const disease: Disease = {
    id,
    name: trimmed,
    symptoms: input.symptoms?.length ? input.symptoms : undefined,
    cure: input.cure?.trim() || undefined,
    diet: input.diet?.trim() || undefined,
    precautions: input.precautions?.trim() || undefined,
    createdAt: now,
  }

  await createFirestoreDocument(
    `businesses/${businessId}/diseases/${id}`,
    idToken,
    disease as unknown as Record<string, unknown>
  )
  return disease
}

export async function updateDisease(
  idToken: string,
  businessId: string,
  id: string,
  input: DiseaseCreateInput
): Promise<Disease> {
  const trimmed = input.name.trim()
  if (!trimmed) {
    throw new Error('Disease name is required')
  }

  const existing = await fetchDiseaseById(idToken, businessId, id)
  if (!existing) {
    throw new Error('Disease not found')
  }

  const disease: Disease = {
    ...existing,
    name: trimmed,
    symptoms: input.symptoms?.length ? input.symptoms : undefined,
    cure: input.cure?.trim() || undefined,
    diet: input.diet?.trim() || undefined,
    precautions: input.precautions?.trim() || undefined,
  }

  await patchFirestoreDocument(
    `businesses/${businessId}/diseases/${id}`,
    idToken,
    disease as unknown as Record<string, unknown>
  )
  return disease
}
