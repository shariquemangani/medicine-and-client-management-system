'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  emptyMedicineFlagFieldOptions,
  flagsToOptions,
  matchFlagCategory,
  type MedicineFlagFieldOptions,
} from '@/data/medicine-flag-fields'
import { fetchAllFlagDetails } from '@/services/flag-api'

export function useMedicineFlagOptions() {
  const [options, setOptions] = useState<MedicineFlagFieldOptions>(
    emptyMedicineFlagFieldOptions()
  )
  const [symptomsCategoryId, setSymptomsCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const categoriesWithFlags = await fetchAllFlagDetails()

      const formCat = matchFlagCategory(categoriesWithFlags, 'formType')
      const statusCat = matchFlagCategory(categoriesWithFlags, 'status')
      const potencyCat = matchFlagCategory(categoriesWithFlags, 'potencies')
      const symptomCat = matchFlagCategory(categoriesWithFlags, 'symptoms')

      setSymptomsCategoryId(symptomCat?.id ?? null)
      setOptions({
        formType: flagsToOptions(formCat?.flags ?? []),
        status: flagsToOptions(statusCat?.flags ?? []),
        potencies: flagsToOptions(potencyCat?.flags ?? []),
        symptoms: flagsToOptions(symptomCat?.flags ?? []),
      })
    } catch (err) {
      setSymptomsCategoryId(null)
      setOptions(emptyMedicineFlagFieldOptions())
      setError(err instanceof Error ? err.message : 'Failed to load flag options')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { options, loading, error, reload, symptomsCategoryId }
}
