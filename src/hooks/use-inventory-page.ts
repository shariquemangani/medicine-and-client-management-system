'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchMedicines,
  getMedicine,
  fetchInventory,
  fetchInventorySummary,
  recordInventory,
} from '@/services/pharmacy-api'
import type { AttendanceStatus, InventorySummary, Medicine, Patient } from '@/types'
import { computeAttendanceStats } from '@/lib/inventory-stats'
import { toast } from 'sonner'
import { t } from '@/lib/labels'

export function useInventoryPage() {
  const [classes, setClasses] = useState<Medicine[]>([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [patients, setPatients] = useState<Patient[]>([])
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [summary, setSummary] = useState<InventorySummary[]>([])
  const [histClass, setHistClass] = useState('all')
  const [histPatient, setHistPatient] = useState('')
  const [tab, setTab] = useState<'record' | 'history'>('record')
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadClasses = useCallback(async () => {
    const result = await fetchMedicines({ limit: 50 })
    setClasses(result.data)
    setClassId((prev) => prev || result.data[0]?.id || '')
  }, [])

  const loadRoster = useCallback(async () => {
    if (!classId) return
    setLoadingRoster(true)
    try {
      const [schoolClass, records] = await Promise.all([
        getMedicine(classId),
        fetchInventory({ date, classId }),
      ])
      setPatients(schoolClass.patients)
      const map: Record<string, AttendanceStatus> = {}
      schoolClass.patients.forEach((s) => {
        map[s.id] = 'present'
      })
      records.forEach((r) => {
        map[r.patientId] = r.status
      })
      setStatuses(map)
    } catch {
      toast.error('Failed to load attendance data')
    } finally {
      setLoadingRoster(false)
    }
  }, [classId, date, t])

  useEffect(() => {
    loadClasses()
      .catch(console.error)
      .finally(() => setInitialLoading(false))
  }, [loadClasses])

  useEffect(() => {
    if (tab !== 'record') return
    loadRoster()
  }, [loadRoster, tab])

  const stats = useMemo(
    () => computeAttendanceStats(patients.length, statuses),
    [statuses, patients.length]
  )

  const rosterLoading = initialLoading || loadingRoster

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadRoster()
    } finally {
      setRefreshing(false)
    }
  }, [loadRoster])

  const save = useCallback(async () => {
    if (!classId) return
    setSaving(true)
    try {
      await recordInventory({
        date,
        classId,
        records: Object.entries(statuses).map(([patientId, status]) => ({ patientId, status })),
      })
      toast.success('Inventory saved')
    } catch {
      toast.error('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }, [classId, date, statuses, t])

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await fetchInventorySummary({
        ...(histClass !== 'all' ? { classId: histClass } : {}),
        ...(histPatient ? { patientId: histPatient } : {}),
      })
      setSummary(data)
    } catch {
      toast.error('Failed to load attendance data')
    } finally {
      setLoadingSummary(false)
    }
  }, [histClass, histPatient, t])

  const setStatus = useCallback((patientId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [patientId]: status }))
  }, [])

  const bulkMark = useCallback(
    (status: AttendanceStatus) => {
      setStatuses((prev) => {
        const next = { ...prev }
        patients.forEach((s) => {
          next[s.id] = status
        })
        return next
      })
    },
    [patients]
  )

  return {
    classes,
    classId,
    setClassId,
    date,
    setDate,
    patients,
    statuses,
    summary,
    histClass,
    setHistClass,
    histPatient,
    setHistPatient,
    tab,
    setTab,
    stats,
    rosterLoading,
    loadingSummary,
    saving,
    refreshing,
    refresh,
    save,
    loadSummary,
    setStatus,
    bulkMark,
  }
}
