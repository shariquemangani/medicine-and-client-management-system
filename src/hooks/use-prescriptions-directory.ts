'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Prescription } from '@/types'
import type { PrescriptionDirectoryFilters, PrescriptionSortDirection, PrescriptionSortField } from '@/types/prescription-page'
import { fetchPrescriptions } from '@/services/pharmacy-api'

const PAGE_SIZE = 8

const defaultFilters: PrescriptionDirectoryFilters = {
  search: '',
  term: 'all',
}

function comparePrescriptions(
  a: Prescription,
  b: Prescription,
  field: PrescriptionSortField,
  direction: PrescriptionSortDirection
) {
  let result = 0
  switch (field) {
    case 'name':
      result = a.name.localeCompare(b.name)
      break
    case 'term':
      result = a.term.localeCompare(b.term)
      break
    case 'academicYear':
      result = a.academicYear.localeCompare(b.academicYear)
      break
    case 'subjects':
      result = a.subjects.length - b.subjects.length
      break
  }
  return direction === 'asc' ? result : -result
}

export function usePrescriptionsDirectory() {
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<PrescriptionDirectoryFilters>(defaultFilters)
  const [sortField, setSortField] = useState<PrescriptionSortField>('name')
  const [sortDirection, setSortDirection] = useState<PrescriptionSortDirection>('asc')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    const data = await fetchPrescriptions()
    setAllPrescriptions(data)
    return data
  }, [])

  useEffect(() => {
    load()
      .catch(console.error)
      .finally(() => setInitialLoading(false))
  }, [load])

  const reload = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } catch (error) {
      console.error(error)
    } finally {
      setRefreshing(false)
    }
  }, [load])

  const stats = useMemo(() => ({
    total: allPrescriptions.length,
    subjects: new Set(allPrescriptions.flatMap((e) => e.subjects)).size,
    classes: new Set(allPrescriptions.flatMap((e) => e.classIds)).size,
  }), [allPrescriptions])

  const availableTerms = useMemo(
    () => Array.from(new Set(allPrescriptions.map((e) => e.term))).sort(),
    [allPrescriptions]
  )

  const filteredPrescriptions = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return allPrescriptions
      .filter((exam) => {
        if (filters.term !== 'all' && exam.term !== filters.term) return false
        if (!search) return true
        const haystack = [
          exam.name,
          exam.term,
          exam.academicYear,
          exam.subjects.join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })
      .sort((a, b) => comparePrescriptions(a, b, sortField, sortDirection))
  }, [allPrescriptions, filters, sortField, sortDirection])

  const totalFiltered = filteredPrescriptions.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))

  const paginatedPrescriptions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredPrescriptions.slice(start, start + PAGE_SIZE)
  }, [filteredPrescriptions, page])

  useEffect(() => {
    setPage(1)
  }, [filters, sortField, sortDirection])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const updateFilter = useCallback(
    <K extends keyof PrescriptionDirectoryFilters>(key: K, value: PrescriptionDirectoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => setFilters(defaultFilters), [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search.trim()) count++
    if (filters.term !== 'all') count++
    return count
  }, [filters])

  const toggleSort = useCallback((field: PrescriptionSortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return field
    })
  }, [])

  return {
    allPrescriptions,
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
    availableTerms,
    paginatedPrescriptions,
    page,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    totalFiltered,
    reload,
  }
}
