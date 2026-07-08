'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Patient } from '@/types'
import type { PatientSortDirection, PatientSortField } from '@/types/patient-page'
import { getPatientDisplayName, getPatientDisplayInitials } from '@/lib/patient-display'
import { formatPatientAmount } from '@/lib/patient-stats'
import { PatientDiseaseCell } from '@/components/patients/patient-disease-cell'
import { PatientsCompactSkeleton, PatientsTableSkeleton } from '@/components/patients/patients-skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PatientsDataTableProps {
  patients: Patient[]
  loading?: boolean
  refreshing?: boolean
  sortField: PatientSortField
  sortDirection: PatientSortDirection
  onSort: (field: PatientSortField) => void
  onView: (patient: Patient) => void
  onDelete: (patient: Patient) => void
  page: number
  totalPages: number
  totalFiltered: number
  pageSize: number
  onPageChange: (page: number) => void
  viewMode: 'table' | 'compact'
}

const primarySortableColumns: { field: PatientSortField; label: string; className?: string }[] = [
  { field: 'name', label: 'Patient Name' },
  { field: 'rollNumber', label: 'ID' },
  { field: 'disease', label: 'Disease' },
  { field: 'createdAt', label: 'Created Date' },
]

const trailingSortableColumns: { field: PatientSortField; label: string; className?: string }[] = [
  { field: 'address', label: 'Address' },
  { field: 'fees', label: 'Total Amount' },
]

const ACTION_COLUMN_CLASS = 'clinic-table-actions-col w-16 min-w-16 max-w-16 px-1'

function renderSortableHeader(
  col: { field: PatientSortField; label: string; className?: string },
  sortField: PatientSortField,
  sortDirection: PatientSortDirection,
  onSort: (field: PatientSortField) => void,
  loading?: boolean
) {
  return (
    <th key={col.field} className={col.className}>
      <button
        type="button"
        className="clinic-table-sort-btn"
        onClick={() => onSort(col.field)}
        disabled={loading}
      >
        {col.label}
        <SortIcon field={col.field} sortField={sortField} sortDirection={sortDirection} />
      </button>
    </th>
  )
}

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, 'MMM d, yyyy')
}

function handleRowKeyDown(event: React.KeyboardEvent, onActivate: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function PatientRowActions({
  patient,
  onView,
  onDelete,
}: {
  patient: Patient
  onView: (patient: Patient) => void
  onDelete: (patient: Patient) => void
}) {
  const fullName = getPatientDisplayName(patient)

  return (
    <div
      className="clinic-table-actions flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action h-7 w-7"
        aria-label={`View ${fullName}`}
        onClick={() => onView(patient)}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action clinic-table-action-delete h-7 w-7"
        aria-label={`Delete ${fullName}`}
        onClick={() => onDelete(patient)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: PatientSortField
  sortField: PatientSortField
  sortDirection: PatientSortDirection
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-patients))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-patients))]" />
  )
}

export function PatientsDataTable({
  patients,
  loading,
  refreshing,
  sortField,
  sortDirection,
  onSort,
  onView,
  onDelete,
  page,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
  viewMode,
}: PatientsDataTableProps) {
  const start = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalFiltered)
  const showSkeleton = loading && patients.length === 0
  const columnCount = primarySortableColumns.length + trailingSortableColumns.length + 2
  const tableBusy = Boolean(refreshing)

  if (viewMode === 'compact') {
    return (
      <div className="space-y-3">
        <div
          className={cn('clinic-compact-grid relative', tableBusy && 'pointer-events-none opacity-60')}
          key={page}
          aria-busy={tableBusy || loading || undefined}
        >
          {tableBusy ? <PatientsTableBusyOverlay /> : null}
          {showSkeleton ? (
            <div className="col-span-full">
              <PatientsCompactSkeleton rows={pageSize} />
            </div>
          ) : patients.length === 0 ? (
            <div className="clinic-table-empty col-span-full">No patients match your filters</div>
          ) : (
            patients.map((patient, index) => (
              <div
                key={patient.id}
                role="button"
                tabIndex={0}
                className="clinic-compact-card clinic-compact-card-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onView(patient)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(patient))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="clinic-avatar flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
                      {getPatientDisplayInitials(patient)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {getPatientDisplayName(patient)}
                      </p>
                      <p className="text-xs text-muted-foreground">{patient.rollNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {formatPatientAmount(patient.fees)}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <PatientDiseaseCell patient={patient} />
                  <p>{formatCreatedDate(patient.createdAt)}</p>
                  <p className="truncate">{patient.phone || patient.email || '—'}</p>
                  <p className="truncate">{patient.address || '—'}</p>
                </div>
                <div className="mt-3 flex justify-end">
                  <PatientRowActions patient={patient} onView={onView} onDelete={onDelete} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="clinic-table-shell relative overflow-hidden rounded-xl border">
          {tableBusy ? <PatientsTableBusyOverlay /> : null}
          <PatientsPagination
            page={page}
            totalPages={totalPages}
            start={start}
            end={end}
            totalFiltered={totalFiltered}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'clinic-table-shell clinic-table-shell-patients relative overflow-hidden rounded-xl border',
        tableBusy && 'pointer-events-none'
      )}
      aria-busy={tableBusy || loading || undefined}
    >
      {tableBusy ? <PatientsTableBusyOverlay /> : null}
      <div
        className={cn('clinic-table-viewport', tableBusy && 'opacity-60')}
        role="region"
        aria-label="Patients table"
        tabIndex={0}
      >
        <table className="clinic-table clinic-table-patients w-full min-w-[80rem]">
          <thead>
            <tr className="clinic-table-head clinic-table-head-sticky">
              {primarySortableColumns.map((col) =>
                renderSortableHeader(col, sortField, sortDirection, onSort, loading)
              )}
              <th className="min-w-[9rem]">Contact</th>
              {trailingSortableColumns.map((col) =>
                renderSortableHeader(col, sortField, sortDirection, onSort, loading)
              )}
              <th className={cn(ACTION_COLUMN_CLASS, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody key={page}>
          {showSkeleton ? (
            <PatientsTableSkeleton rows={pageSize} />
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="clinic-table-empty">
                No patients match your filters
              </td>
            </tr>
          ) : (
            patients.map((patient, index) => (
              <tr
                key={patient.id}
                tabIndex={0}
                className="clinic-table-row clinic-table-row-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onView(patient)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(patient))}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="clinic-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                      {getPatientDisplayInitials(patient)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {getPatientDisplayName(patient)}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="clinic-roll-badge font-mono text-xs">{patient.rollNumber}</span>
                </td>
                <td className="min-w-[11rem]">
                  <PatientDiseaseCell patient={patient} />
                </td>
                <td className="min-w-[7rem]">
                  <span className="text-xs text-foreground">{formatCreatedDate(patient.createdAt)}</span>
                </td>
                <td className="min-w-[9rem]">
                  <div className="text-xs">
                    <p className="truncate text-foreground">{patient.phone || '—'}</p>
                    <p className="truncate text-muted-foreground">{patient.email || '—'}</p>
                  </div>
                </td>
                <td className="min-w-[10rem]">
                  <p className="max-w-[14rem] truncate text-xs text-foreground">
                    {patient.address || '—'}
                  </p>
                </td>
                <td className="min-w-[6.5rem]">
                  <span className="text-xs font-medium text-foreground">
                    {formatPatientAmount(patient.fees)}
                  </span>
                </td>
                <td className={ACTION_COLUMN_CLASS}>
                  <PatientRowActions patient={patient} onView={onView} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>
      <PatientsPagination
        page={page}
        totalPages={totalPages}
        start={start}
        end={end}
        totalFiltered={totalFiltered}
        onPageChange={onPageChange}
      />
    </div>
  )
}

function PatientsTableBusyOverlay() {
  return (
    <div
      className="clinic-table-busy-overlay absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-[1px]"
      aria-hidden
    >
      <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--glass-border))] bg-background/90 px-4 py-2 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--metric-patients))]" />
        <span className="text-xs font-medium text-foreground">Updating patients...</span>
      </div>
    </div>
  )
}

function PatientsPagination({
  page,
  totalPages,
  start,
  end,
  totalFiltered,
  onPageChange,
}: {
  page: number
  totalPages: number
  start: number
  end: number
  totalFiltered: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="clinic-pagination flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {totalFiltered === 0 ? 'No results' : `Showing ${start}–${end} of ${totalFiltered}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
          const pageNum = i + 1
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 w-8 p-0 text-xs', pageNum === page && 'patients-page-btn-active')}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
