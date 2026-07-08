export interface FlagItem {
  id: string
  label: string
  /** Auto-derived from label; not shown in UI */
  value: string
  categoryId: string
  createdAt: string
  updatedAt: string
}

export interface FlagCategory {
  id: string
  name: string
  flagCount: number
  createdAt: string
  updatedAt: string
}

export interface FlagCategoryInput {
  name: string
}

export interface FlagItemInput {
  label: string
}

export interface FlagBulkCreateInput {
  labels: string[]
}

/** Category with nested flags — used by flag details API. */
export interface FlagCategoryWithFlags extends FlagCategory {
  flags: FlagItem[]
}
