export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}

export interface ListQueryParams {
  search?: string
  page?: number
  limit?: number
}
