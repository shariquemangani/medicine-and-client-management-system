import { DomainError } from '@/lib/api/api-error'
import {
  createFirestoreDocument,
  deleteFirestoreDocument,
  fetchFirestoreCollection,
  fetchFirestoreCollectionPage,
  fetchFirestoreDocument,
  patchFirestoreDocument,
} from '@/lib/firebase/firestore-rest'
import { buildNextFlagId } from '@/lib/flags/flag-id'
import {
  GLOBAL_FLAG_CATEGORIES_COLLECTION,
  categoryFlagPath,
  categoryFlagsPath,
  flagCategoryPath,
  tenantFlagBase,
} from '@/lib/flags/flag-paths'
import { toCamelCaseFlagLabel } from '@/lib/flags/camel-case-flag-label'
import { sortFlagsByCreationOrder } from '@/lib/flags/flag-order'
import { generateId } from '@/lib/list-utils'
import type { FlagCategory, FlagCategoryWithFlags, FlagItem, FlagItemInput } from '@/types/flag-config'

export { toCamelCaseFlagLabel } from '@/lib/flags/camel-case-flag-label'

/** Display label as the user typed it (trimmed, inner whitespace collapsed). */
function normalizeFlagLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ')
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

/** First request of a clinic with no taxonomy yet: copy the template (needs an admin to write). */
async function seedFromTemplate(idToken: string, base: string): Promise<boolean> {
  const categories = await fetchFirestoreCollection<FlagCategory>(GLOBAL_FLAG_CATEGORIES_COLLECTION, idToken)
  if (categories.length === 0) return false
  try {
    for (const category of categories) {
      const { id, ...categoryData } = category
      const flags = await fetchFirestoreCollection<FlagItem>(
        categoryFlagsPath(GLOBAL_FLAG_CATEGORIES_COLLECTION, id),
        idToken
      )
      await createIgnoringExisting(flagCategoryPath(base, id), idToken, categoryData)
      for (const flag of flags) {
        const { id: flagId, ...flagData } = flag
        await createIgnoringExisting(categoryFlagPath(base, id, flagId), idToken, flagData)
      }
    }
    return true
  } catch {
    // Staff cannot write; they read the template until an admin opens the page once.
    return false
  }
}

async function createIgnoringExisting(path: string, idToken: string, data: Record<string, unknown>) {
  try {
    await createFirestoreDocument(path, idToken, data)
  } catch (error) {
    if (!/already exists/i.test(error instanceof Error ? error.message : '')) throw error
  }
}

/** Where this clinic's taxonomy lives: its own collection, or the read-only template until seeded. */
async function resolveFlagBase(idToken: string, businessId: string): Promise<string> {
  const base = tenantFlagBase(businessId)
  const own = await fetchFirestoreCollectionPage<FlagCategory>(base, idToken, { pageSize: 1 })
  if (own.length > 0) return base
  return (await seedFromTemplate(idToken, base)) ? base : GLOBAL_FLAG_CATEGORIES_COLLECTION
}

export async function listFlagCategories(idToken: string, businessId: string): Promise<FlagCategory[]> {
  const base = await resolveFlagBase(idToken, businessId)
  const rows = await fetchFirestoreCollection<FlagCategory>(base, idToken)
  return rows.map(normalizeCategory).sort((a, b) => a.name.localeCompare(b.name))
}

export async function createFlagCategory(idToken: string, businessId: string, name: string): Promise<FlagCategory> {
  const trimmed = name.trim()
  if (!trimmed) throw new DomainError('Category name is required')

  const base = await resolveFlagBase(idToken, businessId)
  const existing = await listFlagCategories(idToken, businessId)
  const duplicate = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  if (duplicate) throw new DomainError('A category with this name already exists', 409)

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
    flagCategoryPath(base, id),
    idToken,
    category
  )
  return category
}

export async function updateFlagCategory(
  idToken: string,
  businessId: string,
  categoryId: string,
  name: string
): Promise<FlagCategory> {
  const trimmed = name.trim()
  if (!trimmed) throw new DomainError('Category name is required')

  const base = await resolveFlagBase(idToken, businessId)
  const current = await fetchFirestoreDocument<FlagCategory>(flagCategoryPath(base, categoryId), idToken)
  if (!current) throw new DomainError('Category not found', 404)

  const updatedAt = new Date().toISOString()
  await patchFirestoreDocument(flagCategoryPath(base, categoryId), idToken, {
    name: trimmed,
    updatedAt,
  })

  return normalizeCategory({
    ...current,
    name: trimmed,
    updatedAt,
  })
}

async function listFlagsAt(idToken: string, base: string, categoryId: string): Promise<FlagItem[]> {
  const rows = await fetchFirestoreCollection<FlagItem>(categoryFlagsPath(base, categoryId), idToken)
  return sortFlagsByCreationOrder(rows.map((row) => normalizeFlag(row, categoryId)))
}

export async function listFlagsForCategory(
  idToken: string,
  businessId: string,
  categoryId: string
): Promise<FlagItem[]> {
  return listFlagsAt(idToken, await resolveFlagBase(idToken, businessId), categoryId)
}

/** All categories with flags, or a single category when `categoryId` is set. */
export async function getFlagDetails(
  idToken: string,
  businessId: string,
  categoryId?: string
): Promise<FlagCategoryWithFlags | FlagCategoryWithFlags[]> {
  const base = await resolveFlagBase(idToken, businessId)
  const rows = await fetchFirestoreCollection<FlagCategory>(base, idToken)
  const categories = rows.map(normalizeCategory).sort((a, b) => a.name.localeCompare(b.name))

  if (categoryId) {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) throw new DomainError('Category not found', 404)
    return { ...category, flags: await listFlagsAt(idToken, base, categoryId) }
  }

  return Promise.all(
    categories.map(async (category) => ({
      ...category,
      flags: await listFlagsAt(idToken, base, category.id),
    }))
  )
}

export async function createFlag(
  idToken: string,
  businessId: string,
  categoryId: string,
  input: FlagItemInput
): Promise<FlagItem> {
  const [flag] = await createFlags(idToken, businessId, categoryId, [input.label])
  return flag
}

export async function createFlags(
  idToken: string,
  businessId: string,
  categoryId: string,
  labels: string[]
): Promise<FlagItem[]> {
  // De-duplicate on the derived value so "30C" and "30c" count as the same flag.
  const byValue = new Map<string, string>()
  for (const raw of labels) {
    const label = normalizeFlagLabel(raw)
    const value = toCamelCaseFlagLabel(label)
    if (label && value && !byValue.has(value)) byValue.set(value, label)
  }
  if (byValue.size === 0) throw new DomainError('At least one flag label is required')

  const base = await resolveFlagBase(idToken, businessId)
  const category = await fetchFirestoreDocument<FlagCategory>(flagCategoryPath(base, categoryId), idToken)
  if (!category) throw new DomainError('Category not found', 404)

  const existingFlags = await listFlagsAt(idToken, base, categoryId)
  const existingValues = new Set(existingFlags.map((flag) => (flag.value || toCamelCaseFlagLabel(flag.label)).toLowerCase()))
  const cleaned = Array.from(byValue.entries())
    .filter(([value]) => !existingValues.has(value.toLowerCase()))
    .map(([, label]) => label)
  if (cleaned.length === 0) throw new DomainError('Those flags already exist in this category', 409)
  const existingIds = existingFlags.map((flag) => flag.id)
  const now = new Date().toISOString()
  const created: FlagItem[] = []

  for (const label of cleaned) {
    const id = buildNextFlagId([...existingIds, ...created.map((flag) => flag.id)])
    const flag: FlagItem = {
      id,
      label,
      value: toCamelCaseFlagLabel(label),
      categoryId,
      createdAt: now,
      updatedAt: now,
    }
    await createFirestoreDocument(
      categoryFlagPath(base, categoryId, id),
      idToken,
      flag
    )
    created.push(flag)
  }

  await patchFirestoreDocument(flagCategoryPath(base, categoryId), idToken, {
    flagCount: Number(category.flagCount ?? 0) + created.length,
    updatedAt: now,
  })

  return created
}

export async function updateFlag(
  idToken: string,
  businessId: string,
  categoryId: string,
  flagId: string,
  input: FlagItemInput
): Promise<FlagItem> {
  const label = normalizeFlagLabel(input.label)
  if (!label) throw new DomainError('Flag label is required')

  const base = await resolveFlagBase(idToken, businessId)
  const current = await fetchFirestoreDocument<FlagItem>(
    categoryFlagPath(base, categoryId, flagId),
    idToken
  )
  if (!current) throw new DomainError('Flag not found', 404)

  // Keep `value` stable: medicines and diseases store it, so renaming the label must not orphan them.
  const value = current.value || toCamelCaseFlagLabel(label)
  const updatedAt = new Date().toISOString()

  await patchFirestoreDocument(categoryFlagPath(base, categoryId, flagId), idToken, {
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
  businessId: string,
  categoryId: string,
  flagId: string
): Promise<void> {
  const base = await resolveFlagBase(idToken, businessId)
  const category = await fetchFirestoreDocument<FlagCategory>(flagCategoryPath(base, categoryId), idToken)
  if (!category) throw new DomainError('Category not found', 404)

  await deleteFirestoreDocument(categoryFlagPath(base, categoryId, flagId), idToken)

  const nextCount = Math.max(0, Number(category.flagCount ?? 0) - 1)
  await patchFirestoreDocument(flagCategoryPath(base, categoryId), idToken, {
    flagCount: nextCount,
    updatedAt: new Date().toISOString(),
  })
}
