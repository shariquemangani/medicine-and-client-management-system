'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchMedicines,
  getMedicine,
  fetchPrescriptionItems,
  savePrescriptionItems,
} from '@/services/pharmacy-api'
import type { Prescription, PrescriptionItem, Patient, SubjectMark } from '@/types'
import { toast } from 'sonner'

function buildMarksMap(results: PrescriptionItem[]) {
  const m: Record<string, Record<string, number>> = {}
  results.forEach((r) => {
    m[r.patientId] = {}
    r.marks.forEach((mk) => {
      m[r.patientId][mk.subject] = mk.score
    })
  })
  return m
}

interface UsePrescriptionsMarksOptions {
  allPrescriptions: Prescription[]
  enabled: boolean
  t: (key: string, params?: Record<string, string | number>) => string
}

export function usePrescriptionsMarks({ allPrescriptions, enabled, t }: UsePrescriptionsMarksOptions) {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [selectedPrescription, setSelectedPrescription] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({})
  const [results, setResults] = useState<PrescriptionItem[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!enabled || classes.length > 0) return
    fetchMedicines({ limit: 50 })
      .then((r) => setClasses(r.data.map((c) => ({ id: c.id, name: c.name }))))
      .catch(console.error)
  }, [enabled, classes.length])

  useEffect(() => {
    if (!enabled || !selectedClass) return
    setLoadingRoster(true)
    getMedicine(selectedClass)
      .then((c) => {
        setPatients(c.patients)
        if (!selectedPrescription) {
          setResults([])
          setMarks({})
          return
        }
        return fetchPrescriptionItems(selectedPrescription, selectedClass).then((res) => {
          setResults(res)
          setMarks(buildMarksMap(res))
        })
      })
      .catch(console.error)
      .finally(() => setLoadingRoster(false))
  }, [enabled, selectedPrescription, selectedClass])

  const selectedPrescriptionData = allPrescriptions.find((e) => e.id === selectedPrescription)
  const passCount = results.filter((r) => r.status === 'pass').length

  const saveMarks = useCallback(async () => {
    if (!selectedPrescriptionData || !selectedClass) return false
    setSaving(true)
    try {
      const payload = patients.map((s) => ({
        patientId: s.id,
        marks: selectedPrescriptionData.subjects.map((sub) => ({
          subject: sub,
          score: marks[s.id]?.[sub] ?? 0,
          maxScore: selectedPrescriptionData.maxScore,
        })) as SubjectMark[],
      }))
      const saved = await savePrescriptionItems(selectedPrescription, selectedClass, payload)
      setResults(saved)
      toast.success(t('prescriptions.marksSaved'))
      return true
    } catch {
      toast.error(t('prescriptions.saveFailed'))
      return false
    } finally {
      setSaving(false)
    }
  }, [selectedPrescriptionData, selectedClass, patients, marks, selectedPrescription, t])

  const handleMarkChange = useCallback(
    (patientId: string, subject: string, score: number) => {
      setMarks((prev) => ({
        ...prev,
        [patientId]: { ...prev[patientId], [subject]: score },
      }))
    },
    []
  )

  const enterMarks = useCallback((exam: Prescription) => {
    setSelectedPrescription(exam.id)
  }, [])

  return {
    classes,
    selectedPrescription,
    setSelectedPrescription,
    selectedClass,
    setSelectedClass,
    patients,
    marks,
    results,
    selectedPrescriptionData,
    passCount,
    loadingRoster,
    saving,
    saveMarks,
    handleMarkChange,
    enterMarks,
  }
}
