/**
 * Flag taxonomy paths. Each clinic owns its taxonomy at `businesses/{businessId}/flagCategories`.
 * The top-level `flagCategories` collection is a read-only template that seeds new clinics.
 */
export const GLOBAL_FLAG_CATEGORIES_COLLECTION = 'flagCategories'

export function tenantFlagBase(businessId: string) {
  return `businesses/${businessId}/flagCategories`
}

export function flagCategoryPath(base: string, categoryId: string) {
  return `${base}/${categoryId}`
}

export function categoryFlagsPath(base: string, categoryId: string) {
  return `${flagCategoryPath(base, categoryId)}/flags`
}

export function categoryFlagPath(base: string, categoryId: string, flagId: string) {
  return `${categoryFlagsPath(base, categoryId)}/${flagId}`
}
