'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppSelector } from '@/redux'
import type { Patient } from '@/types'
import type {
  PatientDirectoryFilters,
  PatientSortDirection,
  PatientSortField,
} from '@/types/patient-page'
import {
  computePatientPageStats,
  getPatientDiseaseLabel,
  parsePatientAmount,
} from '@/lib/patient-stats'
import { fetchPatientsList } from '@/services/patient-api'

const PAGE_SIZE = 8

const defaultFilters: PatientDirectoryFilters = {
  search: '',
  classId: 'all',
  status: 'all',
  year: 'all',
}

function comparePatients(
  a: Patient,
  b: Patient,
  field: PatientSortField,
  direction: PatientSortDirection
) {
  let result = 0
  switch (field) {
    case 'name':
      result = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      break
    case 'rollNumber':
      result = a.rollNumber.localeCompare(b.rollNumber)
      break
    case 'disease':
      result = getPatientDiseaseLabel(a).localeCompare(getPatientDiseaseLabel(b))
      break
    case 'createdAt':
      result = (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
      break
    case 'address':
      result = (a.address ?? '').localeCompare(b.address ?? '')
      break
    case 'fees':
      result = parsePatientAmount(a.fees) - parsePatientAmount(b.fees)
      break
  }
  return direction === 'asc' ? result : -result
}

export function usePatientsDirectory() {
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const [patients, setPatients] = useState<Patient[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PatientDirectoryFilters>(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [sortField, setSortField] = useState<PatientSortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<PatientSortDirection>('desc')
  const [page, setPage] = useState(1)

  // Year filter options come from the unfiltered list, so no separate request is needed
  // (a second identical request used to double the server's Firestore reads on every visit).
  const updateYearOptions = useCallback((list: Patient[]) => {
    const years = Array.from(
      new Set(list.map((patient) => patient.year).filter((year): year is number => Number.isFinite(year)))
    ).sort((a, b) => b - a)
    setAvailableYears(years)
  }, [])

  // Latest request wins: a slow response for an old search must not overwrite a newer one.
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPatientsList({
        page: 1,
        limit: 200,
        search: filters.search.trim() || undefined,
        year: filters.year !== 'all' ? Number(filters.year) : undefined,
      })
      if (id !== requestId.current) return
      setPatients(res.data)
      if (!filters.search.trim() && filters.year === 'all') updateYearOptions(res.data)
    } catch (err) {
      if (id !== requestId.current) return
      setPatients([])
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [filters, updateYearOptions])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    load()
  }, [load, authLoading, isAuthenticated])

  const applySearch = useCallback(() => {
    const next = searchInput.trim()
    setFilters((prev) => (prev.search === next ? prev : { ...prev, search: next }))
    setPage(1)
  }, [searchInput])

  const clearSearch = useCallback(() => {
    setSearchInput('')
    setFilters((prev) => (prev.search === '' ? prev : { ...prev, search: '' }))
    setPage(1)
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.year !== 'all') count++
    return count
  }, [filters])

  const stats = useMemo(() => computePatientPageStats(patients), [patients])

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => comparePatients(a, b, sortField, sortDirection)),
    [patients, sortField, sortDirection]
  )

  const totalPages = Math.max(1, Math.ceil(sortedPatients.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedPatients = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return sortedPatients.slice(start, start + PAGE_SIZE)
  }, [sortedPatients, safePage])

  const updateFilter = useCallback(
    <K extends keyof PatientDirectoryFilters>(key: K, value: PatientDirectoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    []
  )

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setFilters(defaultFilters)
    setPage(1)
  }, [])

  const toggleSort = useCallback((field: PatientSortField) => {
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

  const initialLoading = (authLoading || loading) && patients.length === 0 && !error
  const refreshing = loading && patients.length > 0
  const searchHighlight = searchInput.trim().length > 0

  return {
    patients,
    loading,
    error,
    initialLoading,
    refreshing,
    filters,
    searchInput,
    setSearchInput,
    applySearch,
    clearSearch,
    searchHighlight,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    paginatedPatients,
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    totalFiltered: sortedPatients.length,
    sortedPatients,
    availableYears,
    reload: load,
  }
}
