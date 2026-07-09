'use client'

import { useCallback, useEffect, useState } from 'react'
import { flagsToOptions, matchFlagCategory } from '@/data/medicine-flag-fields'
import type { MedicineFlagOption } from '@/data/medicine-flag-fields'
import { fetchAllFlagDetails } from '@/services/flag-api'

export function useDiseaseFlagOptions() {
  const [symptoms, setSymptoms] = useState<MedicineFlagOption[]>([])
  const [symptomsCategoryId, setSymptomsCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const categoriesWithFlags = await fetchAllFlagDetails()
      const symptomCat = matchFlagCategory(categoriesWithFlags, 'symptoms')
      setSymptomsCategoryId(symptomCat?.id ?? null)
      setSymptoms(flagsToOptions(symptomCat?.flags ?? []))
    } catch (err) {
      setSymptomsCategoryId(null)
      setSymptoms([])
      setError(err instanceof Error ? err.message : 'Failed to load flag options')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { symptoms, loading, error, reload, symptomsCategoryId }
}
