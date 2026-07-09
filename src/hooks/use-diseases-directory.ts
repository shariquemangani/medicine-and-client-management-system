'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/redux'
import type { Disease } from '@/types/disease'
import type {
  DiseaseDirectoryFilters,
  DiseaseSortDirection,
  DiseaseSortField,
} from '@/types/disease-page'
import { fetchDiseases } from '@/services/disease-api'

const PAGE_SIZE = 8

const defaultFilters: DiseaseDirectoryFilters = {
  search: '',
}

function compareDiseases(
  a: Disease,
  b: Disease,
  field: DiseaseSortField,
  direction: DiseaseSortDirection
) {
  let result = 0
  switch (field) {
    case 'name':
      result = a.name.localeCompare(b.name)
      break
    case 'symptoms':
      result = (a.symptoms?.join(', ') ?? '').localeCompare(b.symptoms?.join(', ') ?? '')
      break
    case 'cure':
      result = (a.cure ?? '').localeCompare(b.cure ?? '')
      break
  }
  return direction === 'asc' ? result : -result
}

export function useDiseasesDirectory() {
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DiseaseDirectoryFilters>(defaultFilters)
  const [sortField, setSortField] = useState<DiseaseSortField>('name')
  const [sortDirection, setSortDirection] = useState<DiseaseSortDirection>('asc')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDiseases()
      setDiseases(data)
    } catch (err) {
      setDiseases([])
      setError(err instanceof Error ? err.message : 'Failed to load diseases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void load()
  }, [load, authLoading, isAuthenticated])

  const stats = useMemo(() => ({ total: diseases.length }), [diseases])

  const filteredDiseases = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    const rows = query
      ? diseases.filter((disease) => disease.name.toLowerCase().includes(query))
      : diseases
    return [...rows].sort((a, b) => compareDiseases(a, b, sortField, sortDirection))
  }, [diseases, filters.search, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredDiseases.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedDiseases = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredDiseases.slice(start, start + PAGE_SIZE)
  }, [filteredDiseases, safePage])

  const activeFilterCount = useMemo(() => (filters.search ? 1 : 0), [filters.search])

  const updateFilter = useCallback(
    <K extends keyof DiseaseDirectoryFilters>(key: K, value: DiseaseDirectoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPage(1)
  }, [])

  const toggleSort = useCallback((field: DiseaseSortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'))
        return current
      }
      setSortDirection('asc')
      return field
    })
    setPage(1)
  }, [])

  const initialLoading = (authLoading || loading) && diseases.length === 0 && !error
  const refreshing = loading && diseases.length > 0

  return {
    diseases,
    loading,
    error,
    initialLoading,
    refreshing,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    filteredDiseases,
    paginatedDiseases,
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    totalFiltered: filteredDiseases.length,
    reload: load,
  }
}
