'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeFeePageStats } from '@/lib/billing-stats'
import { fetchPatientFeeSummaries, fetchFeeCategories } from '@/services/pharmacy-api'
import type { BillingCategory, PatientBillingSummary } from '@/types'

const PAGE_SIZE = 8

export function useBillingPage() {
  const [summaries, setSummaries] = useState<PatientBillingSummary[]>([])
  const [categories, setCategories] = useState<BillingCategory[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('balances')

  const loadSummaries = useCallback(async () => {
    const data = await fetchPatientFeeSummaries(overdueOnly)
    setSummaries(data)
    return data
  }, [overdueOnly])

  const loadCategories = useCallback(async () => {
    if (categoriesLoaded) return
    setCategoriesLoading(true)
    try {
      const data = await fetchFeeCategories()
      setCategories(data)
      setCategoriesLoaded(true)
    } finally {
      setCategoriesLoading(false)
    }
  }, [categoriesLoaded])

  useEffect(() => {
    setLoading(true)
    loadSummaries()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [loadSummaries])

  useEffect(() => {
    if (activeTab === 'categories') loadCategories()
  }, [activeTab, loadCategories])

  const stats = useMemo(() => computeFeePageStats(summaries), [summaries])

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return summaries
    return summaries.filter(
      (s) =>
        s.patientName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
    )
  }, [summaries, search])

  const totalFiltered = filteredSummaries.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedSummaries = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredSummaries.slice(start, start + PAGE_SIZE)
  }, [filteredSummaries, safePage])

  useEffect(() => {
    setPage(1)
  }, [search, overdueOnly])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      await loadSummaries()
      if (categoriesLoaded) {
        const data = await fetchFeeCategories()
        setCategories(data)
      }
    } finally {
      setLoading(false)
    }
  }, [loadSummaries, categoriesLoaded])

  const setOverdueFilter = useCallback((value: boolean) => {
    setOverdueOnly(value)
    setPage(1)
  }, [])

  const initialLoading = loading && summaries.length === 0
  const refreshing = loading && summaries.length > 0
  const start = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, totalFiltered)

  return {
    stats,
    paginatedSummaries,
    categories,
    categoriesLoading: categoriesLoading && !categoriesLoaded,
    initialLoading,
    refreshing,
    search,
    setSearch,
    overdueOnly,
    setOverdueFilter,
    activeTab,
    setActiveTab,
    page: safePage,
    setPage,
    totalPages,
    totalFiltered,
    start,
    end,
    pageSize: PAGE_SIZE,
    reload,
  }
}
