import {
  createFirestoreDocument,
  deleteFirestoreDocument,
  fetchFirestoreCollection,
  fetchFirestoreDocument,
  patchFirestoreDocument,
} from '@/lib/firebase/firestore-rest'
import { buildNextFlagId } from '@/lib/flags/flag-id'
import {
  categoryFlagPath,
  categoryFlagsPath,
  flagCategoryPath,
  flagCategoriesPath,
} from '@/lib/flags/flag-paths'
import { toCamelCaseFlagLabel } from '@/lib/flags/camel-case-flag-label'
import { sortFlagsByCreationOrder } from '@/lib/flags/flag-order'
import { generateId } from '@/lib/list-utils'
import type { FlagCategory, FlagCategoryWithFlags, FlagItem, FlagItemInput } from '@/types/flag-config'

export { toCamelCaseFlagLabel } from '@/lib/flags/camel-case-flag-label'

function normalizeFlagLabel(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return ''
  return toCamelCaseFlagLabel(trimmed)
}

function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeCategory(raw: FlagCategory): FlagCategory {
  return {
    id: raw.id,
    name: String(raw.name ?? ''),
    flagCount: Number(raw.flagCount ?? 0),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? ''),
  }
}

function normalizeFlag(raw: FlagItem, categoryId: string): FlagItem {
  return {
    id: raw.id,
    label: String(raw.label ?? ''),
    value: String(raw.value ?? ''),
    categoryId: String(raw.categoryId ?? categoryId),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? ''),
  }
}

export async function listFlagCategories(idToken: string): Promise<FlagCategory[]> {
  const rows = await fetchFirestoreCollection<FlagCategory>(flagCategoriesPath(), idToken)
  return rows.map(normalizeCategory).sort((a, b) => a.name.localeCompare(b.name))
}

export async function createFlagCategory(idToken: string, name: string): Promise<FlagCategory> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Category name is required')

  const existing = await listFlagCategories(idToken)
  const duplicate = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  if (duplicate) return duplicate

  const now = new Date().toISOString()
  const id = generateId(slugifyCategory(trimmed) || 'flag-cat')
  const category: FlagCategory = {
    id,
    name: trimmed,
    flagCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await createFirestoreDocument(
    flagCategoryPath(id),
    idToken,
    category as unknown as Record<string, unknown>
  )
  return category
}

export async function updateFlagCategory(
  idToken: string,
  categoryId: string,
  name: string
): Promise<FlagCategory> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Category name is required')

  const current = await fetchFirestoreDocument<FlagCategory>(flagCategoryPath(categoryId), idToken)
  if (!current) throw new Error('Category not found')

  const updatedAt = new Date().toISOString()
  await patchFirestoreDocument(flagCategoryPath(categoryId), idToken, {
    name: trimmed,
    updatedAt,
  })

  return normalizeCategory({
    ...current,
    name: trimmed,
    updatedAt,
  })
}

export async function listFlagsForCategory(
  idToken: string,
  categoryId: string
): Promise<FlagItem[]> {
  const rows = await fetchFirestoreCollection<FlagItem>(categoryFlagsPath(categoryId), idToken)
  return sortFlagsByCreationOrder(rows.map((row) => normalizeFlag(row, categoryId)))
}

/** All categories with flags, or a single category when `categoryId` is set. */
export async function getFlagDetails(
  idToken: string,
  categoryId?: string
): Promise<FlagCategoryWithFlags | FlagCategoryWithFlags[]> {
  const categories = await listFlagCategories(idToken)

  if (categoryId) {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) throw new Error('Category not found')
    const flags = await listFlagsForCategory(idToken, categoryId)
    return { ...category, flags }
  }

  return Promise.all(
    categories.map(async (category) => ({
      ...category,
      flags: await listFlagsForCategory(idToken, category.id),
    }))
  )
}

export async function createFlag(
  idToken: string,
  categoryId: string,
  input: FlagItemInput
): Promise<FlagItem> {
  const [flag] = await createFlags(idToken, categoryId, [input.label])
  return flag
}

export async function createFlags(
  idToken: string,
  categoryId: string,
  labels: string[]
): Promise<FlagItem[]> {
  const cleaned = Array.from(
    new Set(
      labels
        .map((label) => normalizeFlagLabel(label))
        .filter((label) => label.length > 0)
    )
  )
  if (cleaned.length === 0) throw new Error('At least one flag label is required')

  const category = await fetchFirestoreDocument<FlagCategory>(flagCategoryPath(categoryId), idToken)
  if (!category) throw new Error('Category not found')

  const existingFlags = await listFlagsForCategory(idToken, categoryId)
  const existingIds = existingFlags.map((flag) => flag.id)
  const now = new Date().toISOString()
  const created: FlagItem[] = []

  for (const label of cleaned) {
    const id = buildNextFlagId([...existingIds, ...created.map((flag) => flag.id)])
    const flag: FlagItem = {
      id,
      label,
      value: label,
      categoryId,
      createdAt: now,
      updatedAt: now,
    }
    await createFirestoreDocument(
      categoryFlagPath(categoryId, id),
      idToken,
      flag as unknown as Record<string, unknown>
    )
    created.push(flag)
  }

  await patchFirestoreDocument(flagCategoryPath(categoryId), idToken, {
    flagCount: Number(category.flagCount ?? 0) + created.length,
    updatedAt: now,
  })

  return created
}

export async function updateFlag(
  idToken: string,
  categoryId: string,
  flagId: string,
  input: FlagItemInput
): Promise<FlagItem> {
  const label = normalizeFlagLabel(input.label)
  if (!label) throw new Error('Flag label is required')

  const current = await fetchFirestoreDocument<FlagItem>(
    categoryFlagPath(categoryId, flagId),
    idToken
  )
  if (!current) throw new Error('Flag not found')

  const value = label
  const updatedAt = new Date().toISOString()

  await patchFirestoreDocument(categoryFlagPath(categoryId, flagId), idToken, {
    label,
    value,
    updatedAt,
  })

  return normalizeFlag(
    {
      ...current,
      label,
      value,
      updatedAt,
      categoryId,
    },
    categoryId
  )
}

export async function deleteFlag(
  idToken: string,
  categoryId: string,
  flagId: string
): Promise<void> {
  const category = await fetchFirestoreDocument<FlagCategory>(flagCategoryPath(categoryId), idToken)
  if (!category) throw new Error('Category not found')

  await deleteFirestoreDocument(categoryFlagPath(categoryId, flagId), idToken)

  const nextCount = Math.max(0, Number(category.flagCount ?? 0) - 1)
  await patchFirestoreDocument(flagCategoryPath(categoryId), idToken, {
    flagCount: nextCount,
    updatedAt: new Date().toISOString(),
  })
}
