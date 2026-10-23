'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux'
import {
  adjustStockItem,
  clearStockError,
  createStockItemThunk,
  deleteStockItemThunk,
  loadStockData,
  receiveStockItem,
  updateStockItemThunk,
} from '@/redux/slices/stockSlice'
import type {
  StockAdjustInput,
  StockItem,
  StockItemInput,
  StockItemUpdate,
  StockMovementType,
  StockReceiveInput,
} from '@/types/stock'
import type {
  StockDirectoryFilters,
  StockDirectoryTab,
  StockSortDirection,
  StockSortField,
} from '@/types/stock-page'
import { getStockLevelStatus } from '@/lib/stock-utils'

const PAGE_SIZE = 8

export type MovementRange = '7' | '30' | '90' | 'all'
export type MovementTypeFilter = StockMovementType | 'all'

/** Mirrors the service-side cap so the UI can say how many movements are loaded. */
export const MOVEMENT_LOAD_LIMIT = 300

/** Redux thunks reject with a plain string; turn it back into an Error so callers can read `.message`. */
async function unwrapOrThrow<T>(promise: { unwrap: () => Promise<T> }): Promise<T> {
  try {
    return await promise.unwrap()
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(typeof error === 'string' ? error : 'Something went wrong')
  }
}

const defaultFilters: StockDirectoryFilters = {
  search: '',
  status: 'all',
  formType: 'all',
  location: 'all',
}

function compareStockItems(
  a: StockItem,
  b: StockItem,
  field: StockSortField,
  direction: StockSortDirection
) {
  let result = 0
  switch (field) {
    case 'medicineName':
      result = a.medicineName.localeCompare(b.medicineName)
      break
    case 'totalQuantity':
      result = a.totalQuantity - b.totalQuantity
      break
    case 'reorderLevel':
      result = a.reorderLevel - b.reorderLevel
      break
    case 'location':
      result = a.location.localeCompare(b.location)
      break
    case 'lastMovementAt':
      result = (a.lastMovementAt ?? '').localeCompare(b.lastMovementAt ?? '')
      break
  }
  return direction === 'asc' ? result : -result
}

export function useStockDirectory() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const { items, movements, alerts, stats, loading, saving, error } = useAppSelector((s) => s.stock)

  const [filters, setFilters] = useState<StockDirectoryFilters>(defaultFilters)
  const [sortField, setSortField] = useState<StockSortField>('medicineName')
  const [sortDirection, setSortDirection] = useState<StockSortDirection>('asc')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<StockDirectoryTab>('ledger')
  const [refreshing, setRefreshing] = useState(false)
  const [movementType, setMovementType] = useState<MovementTypeFilter>('all')
  const [movementRange, setMovementRange] = useState<MovementRange>('all')

  const reload = useCallback(async () => {
    setRefreshing(true)
    try {
      await dispatch(loadStockData({ force: true })).unwrap()
    } finally {
      setRefreshing(false)
    }
  }, [dispatch])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void dispatch(loadStockData())
  }, [authLoading, isAuthenticated, dispatch])

  const formTypes = useMemo(() => {
    const set = new Set(items.map((i) => i.formType).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [items])

  const locations = useMemo(() => {
    const set = new Set(items.map((i) => i.location).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return items.filter((item) => {
      if (filters.status !== 'all' && getStockLevelStatus(item) !== filters.status) return false
      if (filters.formType !== 'all' && (item.formType ?? '') !== filters.formType) return false
      if (filters.location !== 'all' && item.location !== filters.location) return false
      if (!search) return true
      const haystack = [
        item.medicineName,
        item.commonName,
        item.formType,
        item.potency,
        item.location,
        item.supplier,
        ...item.batches.map((b) => b.batchNumber),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }, [items, filters])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => compareStockItems(a, b, sortField, sortDirection))
  }, [filteredItems, sortField, sortDirection])

  const filteredMovements = useMemo(() => {
    const cutoff =
      movementRange === 'all' ? 0 : Date.now() - Number(movementRange) * 24 * 60 * 60 * 1000
    return movements.filter((m) => {
      if (movementType !== 'all' && m.type !== movementType) return false
      return cutoff === 0 || new Date(m.createdAt).getTime() >= cutoff
    })
  }, [movements, movementType, movementRange])

  /** Items sorted and filtered for export (all pages, not just the visible one). */
  const exportItems = sortedItems

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sortedItems.slice(start, start + PAGE_SIZE)
  }, [sortedItems, page])

  useEffect(() => {
    setPage(1)
  }, [filters, sortField, sortDirection])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search.trim()) count++
    if (filters.status !== 'all') count++
    if (filters.formType !== 'all') count++
    if (filters.location !== 'all') count++
    return count
  }, [filters])

  const updateFilter = useCallback(
    <K extends keyof StockDirectoryFilters>(key: K, value: StockDirectoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => setFilters(defaultFilters), [])

  const toggleSort = useCallback((field: StockSortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return field
    })
  }, [])

  const receive = useCallback(
    async (input: StockReceiveInput) => {
      await unwrapOrThrow(dispatch(receiveStockItem(input)))
    },
    [dispatch]
  )

  const adjust = useCallback(
    async (input: StockAdjustInput) => {
      await unwrapOrThrow(dispatch(adjustStockItem(input)))
    },
    [dispatch]
  )

  const createItem = useCallback(
    async (input: StockItemInput) => {
      await unwrapOrThrow(dispatch(createStockItemThunk(input)))
    },
    [dispatch]
  )

  const updateItem = useCallback(
    async (id: string, patch: StockItemUpdate) => {
      await unwrapOrThrow(dispatch(updateStockItemThunk({ id, patch })))
    },
    [dispatch]
  )

  const removeItem = useCallback(
    async (id: string) => {
      await unwrapOrThrow(dispatch(deleteStockItemThunk(id)))
    },
    [dispatch]
  )

  const dismissError = useCallback(() => dispatch(clearStockError()), [dispatch])

  return {
    items,
    movements,
    alerts,
    stats,
    initialLoading: loading && items.length === 0,
    loading,
    saving,
    error,
    refreshing,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    formTypes,
    locations,
    sortField,
    sortDirection,
    toggleSort,
    paginatedItems,
    totalFiltered: sortedItems.length,
    page,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    tab,
    setTab,
    reload,
    receive,
    adjust,
    createItem,
    updateItem,
    removeItem,
    movementType,
    setMovementType,
    movementRange,
    setMovementRange,
    filteredMovements,
    exportItems,
    dismissError,
  }
}
