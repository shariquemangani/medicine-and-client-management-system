'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/redux'
import type { Medicine } from '@/types'
import type {
  MedicineDirectoryFilters,
  MedicineSortDirection,
  MedicineSortField,
} from '@/types/medicine-page'
import { computeMedicinePageStats } from '@/lib/medicine-stats'
import { fetchMedicinesList } from '@/services/medicine-api'

const PAGE_SIZE = 8

const defaultFilters: MedicineDirectoryFilters = {
  search: '',
  status: 'all',
  formType: 'all',
}

function compareMedicines(
  a: Medicine,
  b: Medicine,
  field: MedicineSortField,
  direction: MedicineSortDirection
) {
  let result = 0
  switch (field) {
    case 'name':
      result = a.name.localeCompare(b.name)
      break
    case 'formType':
      result = (a.formType ?? '').localeCompare(b.formType ?? '')
      break
    case 'status':
      result = (a.status ?? '').localeCompare(b.status ?? '')
      break
    case 'createdAt':
      result = (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
      break
  }
  return direction === 'asc' ? result : -result
}

export function useMedicinesDirectory() {
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MedicineDirectoryFilters>(defaultFilters)
  const [sortField, setSortField] = useState<MedicineSortField>('name')
  const [sortDirection, setSortDirection] = useState<MedicineSortDirection>('asc')
  const [page, setPage] = useState(1)
  const [libraryStats, setLibraryStats] = useState<ReturnType<typeof computeMedicinePageStats> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchMedicinesList({
        page: 1,
        limit: 200,
        search: filters.search.trim() || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        formType: filters.formType !== 'all' ? filters.formType : undefined,
      })
      setMedicines(res.data)
      const unfiltered = !filters.search.trim() && filters.status === 'all' && filters.formType === 'all'
      if (unfiltered) setLibraryStats(computeMedicinePageStats(res.data))
    } catch (err) {
      // Keep what is on screen: a failed refresh must not look like an empty vault.
      setError(err instanceof Error ? err.message : 'Failed to load medicines')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void load()
  }, [load, authLoading, isAuthenticated])

  // Hero totals describe the whole vault, not the current search result.
  const stats = useMemo(
    () => libraryStats ?? computeMedicinePageStats(medicines),
    [libraryStats, medicines]
  )

  const filteredMedicines = useMemo(
    () => [...medicines].sort((a, b) => compareMedicines(a, b, sortField, sortDirection)),
    [medicines, sortField, sortDirection]
  )

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedMedicines = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredMedicines.slice(start, start + PAGE_SIZE)
  }, [filteredMedicines, safePage])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status !== 'all') count++
    if (filters.formType !== 'all') count++
    return count
  }, [filters])

  const updateFilter = useCallback(
    <K extends keyof MedicineDirectoryFilters>(key: K, value: MedicineDirectoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPage(1)
  }, [])

  const toggleSort = useCallback((field: MedicineSortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'))
        return current
      }
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc')
      return field
    })
    setPage(1)
  }, [])

  const initialLoading = (authLoading || loading) && medicines.length === 0 && !error
  const refreshing = loading && medicines.length > 0

  return {
    medicines,
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
    filteredMedicines,
    paginatedMedicines,
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    totalFiltered: filteredMedicines.length,
    reload: load,
    /** @deprecated Use paginatedMedicines */
    paginatedClasses: paginatedMedicines,
    /** @deprecated Use medicines */
    allClasses: medicines,
  }
}
