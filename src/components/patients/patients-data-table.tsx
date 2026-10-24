'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Patient } from '@/types'
import type { PatientSortDirection, PatientSortField } from '@/types/patient-page'
import { getPatientDisplayName } from '@/lib/patient-display'
import { formatPatientAmount } from '@/lib/patient-stats'
import { PatientDiseaseCell } from '@/components/patients/patient-disease-cell'
import { PatientsCompactSkeleton, PatientsTableSkeleton } from '@/components/patients/patients-skeleton'
import { Button } from '@/components/ui/button'
import { MemberCell } from '@/components/shared'
import { usePermission } from '@/hooks/use-permission'
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
  /** True while a search or filter is applied (changes what an empty list means). */
  isFiltered?: boolean
  onAddPatient?: () => void
}

const primarySortableColumns: { field: PatientSortField; label: string; className?: string }[] = [
  { field: 'name', label: 'Patient Name' },
  { field: 'rollNumber', label: 'ID' },
  { field: 'disease', label: 'Disease' },
  { field: 'createdAt', label: 'Created Date' },
]

const trailingSortableColumns: { field: PatientSortField; label: string; className?: string }[] = [
  { field: 'address', label: 'Address', className: 'hidden xl:table-cell' },
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
    <th
      scope="col"
      key={col.field}
      className={col.className}
      aria-sort={sortField === col.field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
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
  const { hasPermission } = usePermission()
  const canDelete = hasPermission('patients', 'delete')

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
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="clinic-table-action clinic-table-action-delete h-7 w-7"
          aria-label={`Delete ${fullName}`}
          onClick={() => onDelete(patient)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
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
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-patients-text))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-patients-text))]" />
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
  isFiltered = false,
  onAddPatient,
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
            <div className="col-span-full"><PatientsEmpty isFiltered={isFiltered} onAddPatient={onAddPatient} /></div>
          ) : (
            patients.map((patient, index) => (
              <div
                key={patient.id}
                className="clinic-compact-card clinic-compact-card-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onView(patient)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <MemberCell name={getPatientDisplayName(patient)} secondary={patient.rollNumber} />
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
        <div className="clinic-table-shell relative overflow-hidden rounded-2xl border">
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
        'clinic-table-shell clinic-table-shell-patients relative overflow-hidden rounded-2xl border',
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
        <table className="clinic-table clinic-table-patients w-full min-w-[48rem]">
          <caption className="sr-only">Patients</caption>
          <thead>
            <tr className="clinic-table-head clinic-table-head-sticky">
              {primarySortableColumns.map((col) =>
                renderSortableHeader(col, sortField, sortDirection, onSort, loading)
              )}
              <th scope="col" className="min-w-[9rem]">Contact</th>
              {trailingSortableColumns.map((col) =>
                renderSortableHeader(col, sortField, sortDirection, onSort, loading)
              )}
              <th scope="col" className={cn(ACTION_COLUMN_CLASS, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody key={page}>
          {showSkeleton ? (
            <PatientsTableSkeleton rows={pageSize} />
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan={columnCount}>
                <PatientsEmpty isFiltered={isFiltered} onAddPatient={onAddPatient} />
              </td>
            </tr>
          ) : (
            patients.map((patient, index) => (
              <tr
                key={patient.id}
                className="clinic-table-row clinic-table-row-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onView(patient)}
              >
                <td>
                  <MemberCell name={getPatientDisplayName(patient)} />
                </td>
                <td>
                  <span className="clinic-roll-badge font-mono text-xs">{patient.rollNumber}</span>
                </td>
                <td className="min-w-[9rem]">
                  <PatientDiseaseCell patient={patient} />
                </td>
                <td className="min-w-[7rem]">
                  <span className="text-xs text-foreground">{formatCreatedDate(patient.createdAt)}</span>
                </td>
                <td className="min-w-[9rem]">
                  <div className="text-xs">
                    <p className="truncate text-foreground">{patient.phone || '—'}</p>
                    {patient.email ? <p className="truncate text-muted-foreground">{patient.email}</p> : null}
                  </div>
                </td>
                <td className="hidden min-w-[8rem] xl:table-cell">
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

function PatientsEmpty({ isFiltered, onAddPatient }: { isFiltered: boolean; onAddPatient?: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
        <UserPlus className="h-5 w-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {isFiltered ? 'No patients match your filters' : 'No patients yet'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFiltered
            ? 'Try a different search or clear the filters.'
            : 'Register your first patient to start building the clinic record.'}
        </p>
      </div>
      {!isFiltered && onAddPatient ? (
        <Button type="button" size="sm" onClick={onAddPatient}>
          <UserPlus className="h-4 w-4" aria-hidden />
          Add patient
        </Button>
      ) : null}
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
          aria-label="Previous page"
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
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
