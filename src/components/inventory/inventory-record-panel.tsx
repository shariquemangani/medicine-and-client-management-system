'use client'

import { CalendarDays, Clock, UserCheck, UserX, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AttendanceStatus, Medicine, Patient } from '@/types'
import { cn } from '@/lib/utils'
import { getPatientDisplayInitials, getPatientDisplayName, getTranslatedClassName } from '@/lib/patient-display'
import { t } from '@/lib/labels'

interface InventoryRecordPanelProps {
  date: string
  classId: string
  classes: Medicine[]
  patients: Patient[]
  statuses: Record<string, AttendanceStatus>
  stats: { total: number; present: number; absent: number; late: number }
  loading?: boolean
  onDateChange: (date: string) => void
  onClassChange: (classId: string) => void
  onStatusChange: (patientId: string, status: AttendanceStatus) => void
  onBulkMark: (status: AttendanceStatus) => void
}

const statusOptions: {
  value: AttendanceStatus
  labelKey: string
  icon: typeof UserCheck
}[] = [
  { value: 'present', labelKey: 'dashboard.present', icon: UserCheck },
  { value: 'absent', labelKey: 'dashboard.absent', icon: UserX },
  { value: 'late', labelKey: 'inventory.late', icon: Clock },
]

export function InventoryRecordPanel({
  date,
  classId,
  classes,
  patients,
  statuses,
  stats,
  loading,
  onDateChange,
  onClassChange,
  onStatusChange,
  onBulkMark,
}: InventoryRecordPanelProps) {
  const progress = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  return (
    <div className="attendance-record space-y-5">
      <div className="attendance-record-toolbar rounded-2xl border p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {'Date'}
              </label>
              <div className="attendance-field relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="attendance-input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {'Class'}
              </label>
              <Select value={classId} onValueChange={onClassChange}>
                <SelectTrigger className="attendance-input">
                  <SelectValue placeholder={'Select class'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {getTranslatedClassName(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="attendance-bulk-btn attendance-bulk-present"
              onClick={() => onBulkMark('present')}
              disabled={loading || patients.length === 0}
            >
              <UserCheck className="mr-1.5 h-3.5 w-3.5" />
              {'Mark all present'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="attendance-bulk-btn attendance-bulk-absent"
              onClick={() => onBulkMark('absent')}
              disabled={loading || patients.length === 0}
            >
              <UserX className="mr-1.5 h-3.5 w-3.5" />
              {'Mark all absent'}
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{'Session progress'}</span>
            <span className="text-muted-foreground">
              {`${stats.present} of ${stats.total} present`}
            </span>
          </div>
          <div className="attendance-record-progress-track h-2 overflow-hidden rounded-full">
            <div
              className="attendance-record-progress-fill h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
            <span className="attendance-record-legend attendance-record-legend-present">
              {'Present'}: {stats.present}
            </span>
            <span className="attendance-record-legend attendance-record-legend-absent">
              {'Absent'}: {stats.absent}
            </span>
            <span className="attendance-record-legend attendance-record-legend-late">
              {'Late'}: {stats.late}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="attendance-record-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="attendance-record-card attendance-record-card-skeleton rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="dashboard-skeleton h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <div className="dashboard-skeleton h-3 w-28 rounded" />
                  <div className="dashboard-skeleton h-2.5 w-16 rounded" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="dashboard-skeleton h-9 rounded-lg" />
                <div className="dashboard-skeleton h-9 rounded-lg" />
                <div className="dashboard-skeleton h-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="attendance-record-empty rounded-2xl border p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">{'No patients in this class'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{'Select a class that has enrolled patients.'}</p>
        </div>
      ) : (
        <div className="attendance-record-grid">
          {patients.map((patient, index) => {
            const status = statuses[patient.id] ?? 'present'
            return (
              <article
                key={patient.id}
                className={cn(
                  'attendance-record-card clinic-list-item-enter rounded-2xl border p-4 transition-all duration-200',
                  `attendance-record-card-${status}`
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="attendance-record-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                    {getPatientDisplayInitials(patient)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {getPatientDisplayName(patient)}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {patient.rollNumber}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1.5">
                  {statusOptions.map(({ value, labelKey, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={status === value}
                      onClick={() => onStatusChange(patient.id, value)}
                      className={cn(
                        'attendance-record-status-btn flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-all duration-200',
                        `attendance-record-status-btn-${value}`,
                        status === value && 'attendance-record-status-btn-active'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t(labelKey)}</span>
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
