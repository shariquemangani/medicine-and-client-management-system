/** Shared flag configuration — top-level Firestore paths (not scoped to a business). */
export const FLAG_CATEGORIES_COLLECTION = 'flagCategories'

export function flagCategoriesPath() {
  return FLAG_CATEGORIES_COLLECTION
}

export function flagCategoryPath(categoryId: string) {
  return `${flagCategoriesPath()}/${categoryId}`
}

export function categoryFlagsPath(categoryId: string) {
  return `${flagCategoryPath(categoryId)}/flags`
}

export function categoryFlagPath(categoryId: string, flagId: string) {
  return `${categoryFlagsPath(categoryId)}/${flagId}`
}
