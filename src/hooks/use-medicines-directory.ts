'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Medicine } from '@/types'
import type { ClassDirectoryFilters, ClassSortDirection, ClassSortField } from '@/types/medicine-page'
import { computeClassPageStats } from '@/lib/medicine-stats'
import { fetchMedicines } from '@/services/pharmacy-api'

const PAGE_SIZE = 8

const defaultFilters: ClassDirectoryFilters = {
  search: '',
  grade: 'all',
}

type ClassWithCount = Medicine & { patientCount?: number }

function compareClasses(
  a: ClassWithCount,
  b: ClassWithCount,
  field: ClassSortField,
  direction: ClassSortDirection
) {
  let result = 0
  switch (field) {
    case 'name':
      result = a.name.localeCompare(b.name)
      break
    case 'grade':
      result = (a.grade ?? '').localeCompare(b.grade ?? '', undefined, { numeric: true })
      break
    case 'section':
      result = (a.section ?? '').localeCompare(b.section ?? '')
      break
    case 'patientCount':
      result =
        (a.patientCount ?? a.patientIds?.length ?? 0) -
        (b.patientCount ?? b.patientIds?.length ?? 0)
      break
    case 'homeroomStaffName':
      result = (a.homeroomStaffName ?? '').localeCompare(b.homeroomStaffName ?? '')
      break
  }
  return direction === 'asc' ? result : -result
}

export function useMedicinesDirectory() {
  const [allClasses, setAllClasses] = useState<ClassWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ClassDirectoryFilters>(defaultFilters)
  const [sortField, setSortField] = useState<ClassSortField>('name')
  const [sortDirection, setSortDirection] = useState<ClassSortDirection>('asc')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchMedicines({ limit: 100 })
      setAllClasses(result.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => computeClassPageStats(allClasses), [allClasses])

  const filteredClasses = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return allClasses
      .filter((cls) => {
        if (filters.grade !== 'all' && cls.grade !== filters.grade) return false
        if (!search) return true
        const haystack = [
          cls.name,
          cls.commonName,
          cls.abbreviation,
          cls.information,
          cls.scheduleSummary,
          cls.categoryName,
          cls.keynotes,
          cls.grade,
          cls.section,
          cls.homeroomStaffName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })
      .sort((a, b) => compareClasses(a, b, sortField, sortDirection))
  }, [allClasses, filters, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedClasses = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredClasses.slice(start, start + PAGE_SIZE)
  }, [filteredClasses, safePage])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.grade !== 'all') count++
    return count
  }, [filters])

  const updateFilter = useCallback(
    <K extends keyof ClassDirectoryFilters>(key: K, value: ClassDirectoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPage(1)
  }, [])

  const toggleSort = useCallback((field: ClassSortField) => {
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

  const availableGrades = useMemo(
    () =>
      Array.from(
        new Set(
          allClasses
            .map((cls) => cls.categoryName || cls.grade)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [allClasses]
  )

  const initialLoading = loading && allClasses.length === 0
  const refreshing = loading && allClasses.length > 0

  return {
    allClasses,
    loading,
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
    filteredClasses,
    paginatedClasses,
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    totalFiltered: filteredClasses.length,
    availableGrades,
    reload: load,
  }
}
