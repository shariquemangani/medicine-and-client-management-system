'use client'

import { Save, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Prescription, Patient } from '@/types'
import { getPatientDisplayInitials, getPatientDisplayName } from '@/lib/patient-display'

interface PrescriptionItemsPanelProps {
  exams: Prescription[]
  classes: { id: string; name: string }[]
  selectedPrescription: string
  selectedClass: string
  patients: Patient[]
  marks: Record<string, Record<string, number>>
  exam: Prescription | undefined
  loading?: boolean
  saving?: boolean
  onPrescriptionChange: (id: string) => void
  onClassChange: (id: string) => void
  onMarkChange: (patientId: string, subject: string, score: number) => void
  onSave: () => void
}

export function PrescriptionItemsPanel({
  exams,
  classes,
  selectedPrescription,
  selectedClass,
  patients,
  marks,
  exam,
  loading,
  saving,
  onPrescriptionChange,
  onClassChange,
  onMarkChange,
  onSave,
}: PrescriptionItemsPanelProps) {

  return (
    <div className="exams-marks space-y-5">
      <div className="exams-marks-toolbar rounded-2xl border p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {'Select exam'} <span className="text-destructive">*</span>
              </label>
              <Select value={selectedPrescription} onValueChange={onPrescriptionChange}>
                <SelectTrigger className="exams-input">
                  <SelectValue placeholder={'Select exam'} />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {'Class'} <span className="text-destructive">*</span>
              </label>
              <Select value={selectedClass} onValueChange={onClassChange}>
                <SelectTrigger className="exams-input">
                  <SelectValue placeholder={'Select class'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={onSave}
            disabled={!selectedPrescription || !selectedClass || saving}
            className="exams-marks-save"
          >
            <Save className={`mr-1.5 h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} />
            {'Save marks'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="clinic-table-shell rounded-xl border p-8">
          <div className="dashboard-skeleton mx-auto h-4 w-48 rounded" />
        </div>
      ) : !exam || patients.length === 0 ? (
        <div className="exams-marks-empty rounded-2xl border p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">{'No patients to mark'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{'Select an exam and class with enrolled patients.'}</p>
        </div>
      ) : (
        <div className="clinic-table-shell overflow-x-auto rounded-xl border">
          <table className="clinic-table w-full">
            <thead>
              <tr className="clinic-table-head">
                <th>{'Patient'}</th>
                {exam.subjects.map((s) => (
                  <th key={s}>{s}</th>
                ))}
                <th>{'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((s, index) => {
                const total = exam.subjects.reduce(
                  (sum, sub) => sum + (marks[s.id]?.[sub] ?? 0),
                  0
                )
                return (
                  <tr
                    key={s.id}
                    className="clinic-table-row clinic-list-item-enter"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="exams-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                          {getPatientDisplayInitials(s)}
                        </div>
                        <span className="font-medium">{getPatientDisplayName(s)}</span>
                      </div>
                    </td>
                    {exam.subjects.map((sub) => (
                      <td key={sub}>
                        <Input
                          type="number"
                          min={0}
                          max={exam.maxScore}
                          className="exams-input h-8 w-16"
                          value={marks[s.id]?.[sub] ?? ''}
                          onChange={(e) =>
                            onMarkChange(s.id, sub, Number(e.target.value))
                          }
                        />
                      </td>
                    ))}
                    <td className="font-semibold tabular-nums">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
