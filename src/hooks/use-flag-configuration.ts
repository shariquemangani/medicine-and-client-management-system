'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  createFlags as createFlagsApi,
  createFlagCategory as createCategoryApi,
  deleteFlag as deleteFlagApi,
  fetchFlagCategories,
  fetchFlags,
  updateFlag as updateFlagApi,
} from '@/services/flag-api'
import type { FlagCategory, FlagItem, FlagItemInput } from '@/types/flag-config'

export function useFlagConfiguration() {
  const [categories, setCategories] = useState<FlagCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [flags, setFlags] = useState<FlagItem[]>([])
  const [flagSearch, setFlagSearch] = useState('')
  const [mobilePane, setMobilePane] = useState<'categories' | 'flags'>('categories')
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [flagsLoading, setFlagsLoading] = useState(false)
  // Which category the `flags` state currently describes (avoids an empty-state flash).
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const flagsCache = useRef<Map<string, FlagItem[]>>(new Map())
  const selectedRef = useRef<string | null>(null)

  selectedRef.current = selectedCategoryId

  const loadCategories = useCallback(async (preferSelectId?: string | null) => {
    setCategoriesLoading(true)
    setError(null)
    try {
      const list = await fetchFlagCategories()
      setCategories(list)
      setSelectedCategoryId((current) => {
        if (preferSelectId && list.some((c) => c.id === preferSelectId)) {
          return preferSelectId
        }
        if (current && list.some((c) => c.id === current)) return current
        return list[0]?.id ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      setCategories([])
      setSelectedCategoryId(null)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const loadFlags = useCallback(async (categoryId: string, force = false) => {
    if (!force) {
      const cached = flagsCache.current.get(categoryId)
      if (cached) {
        startTransition(() => {
          setFlags(cached)
          setLoadedFor(categoryId)
        })
        return
      }
    }

    setFlagsLoading(true)
    setError(null)
    try {
      const list = await fetchFlags(categoryId)
      flagsCache.current.set(categoryId, list)
      if (selectedRef.current === categoryId) {
        setFlags(list)
        setLoadedFor(categoryId)
      }
    } catch (err) {
      if (selectedRef.current === categoryId) {
        setFlags([])
        setLoadedFor(categoryId)
        setError(err instanceof Error ? err.message : 'Failed to load flags')
      }
    } finally {
      if (selectedRef.current === categoryId) {
        setFlagsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedCategoryId) {
      setFlags([])
      return
    }
    void loadFlags(selectedCategoryId)
  }, [selectedCategoryId, loadFlags])

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  )

  const filteredFlags = useMemo(() => {
    const q = flagSearch.trim().toLowerCase()
    if (!q) return flags
    return flags.filter(
      (f) => f.label.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
    )
  }, [flags, flagSearch])

  const selectCategory = useCallback((id: string) => {
    setSelectedCategoryId(id)
    setFlagSearch('')
    setMobilePane('flags')
  }, [])

  const backToCategories = useCallback(() => {
    setMobilePane('categories')
  }, [])

  const bumpCategoryCount = useCallback((categoryId: string, delta: number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, flagCount: Math.max(0, c.flagCount + delta) }
          : c
      )
    )
  }, [])

  const addCategory = useCallback(async (name: string) => {
    setMutating(true)
    try {
      const category = await createCategoryApi(name)
      flagsCache.current.set(category.id, [])
      setLoadedFor(category.id)
      setCategories((prev) => {
        if (prev.some((c) => c.id === category.id)) {
          return prev.map((c) => (c.id === category.id ? category : c))
        }
        return [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
      })
      setSelectedCategoryId(category.id)
      setFlags([])
      setFlagSearch('')
      setMobilePane('flags')
      return category
    } finally {
      setMutating(false)
    }
  }, [])

  const addFlags = useCallback(async (categoryId: string, labels: string[]) => {
    setMutating(true)
    try {
      const created = await createFlagsApi(categoryId, labels)
      const prev = flagsCache.current.get(categoryId) ?? []
      const existingIds = new Set(prev.map((flag) => flag.id))
      const next = [
        ...prev,
        ...created.filter((flag) => !existingIds.has(flag.id)),
      ]
      flagsCache.current.set(categoryId, next)
      if (selectedRef.current === categoryId) setFlags(next)
      bumpCategoryCount(categoryId, created.length)
      return created
    } finally {
      setMutating(false)
    }
  }, [bumpCategoryCount])

  const addFlag = useCallback(
    async (categoryId: string, input: FlagItemInput) => {
      const flags = await addFlags(categoryId, [input.label])
      return flags[0]
    },
    [addFlags]
  )

  const updateFlag = useCallback(
    async (categoryId: string, flagId: string, input: FlagItemInput) => {
      setMutating(true)
      try {
        const flag = await updateFlagApi(categoryId, flagId, input)
        const prev = flagsCache.current.get(categoryId) ?? []
        const next = prev.map((f) => (f.id === flagId ? flag : f))
        flagsCache.current.set(categoryId, next)
        if (selectedRef.current === categoryId) setFlags(next)
        return flag
      } finally {
        setMutating(false)
      }
    },
    []
  )

  const deleteFlag = useCallback(
    async (categoryId: string, flagId: string) => {
      setMutating(true)
      try {
        await deleteFlagApi(categoryId, flagId)
        const prev = flagsCache.current.get(categoryId) ?? []
        const next = prev.filter((f) => f.id !== flagId)
        flagsCache.current.set(categoryId, next)
        if (selectedRef.current === categoryId) setFlags(next)
        bumpCategoryCount(categoryId, -1)
      } finally {
        setMutating(false)
      }
    },
    [bumpCategoryCount]
  )

  return {
    categories,
    selectedCategoryId,
    selectedCategory,
    filteredFlags,
    flagSearch,
    setFlagSearch,
    mobilePane,
    categoriesLoading,
    flagsLoading: flagsLoading || (selectedCategoryId !== null && loadedFor !== selectedCategoryId),
    mutating,
    error,
    selectCategory,
    backToCategories,
    addCategory,
    addFlag,
    addFlags,
    updateFlag,
    deleteFlag,
    reloadCategories: loadCategories,
  }
}
