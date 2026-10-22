'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Activity,
} from 'lucide-react'
import type { Disease } from '@/types/disease'
import type { DiseaseSortDirection, DiseaseSortField } from '@/types/disease-page'
import {
  DiseasesCompactSkeleton,
  DiseasesTableSkeleton,
} from '@/components/diseases/diseases-skeleton'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import { Skel } from '@/components/medicines/skeleton-bits'
import type { MedicineFlagOption } from '@/data/medicine-flag-fields'
import { DiseaseSymptomBadges } from '@/components/diseases/disease-symptom-badges'
import { resolveSymptomLabels } from '@/lib/diseases/disease-symptoms'

interface DiseasesDataTableProps {
  diseases: Disease[]
  symptomOptions?: Pick<MedicineFlagOption, 'value' | 'label'>[]
  loading?: boolean
  refreshing?: boolean
  sortField: DiseaseSortField
  sortDirection: DiseaseSortDirection
  onSort: (field: DiseaseSortField) => void
  onView: (disease: Disease) => void
  onDelete: (disease: Disease) => void
  page: number
  totalPages: number
  totalFiltered: number
  pageSize: number
  onPageChange: (page: number) => void
  viewMode: 'table' | 'compact'
}

function handleRowKeyDown(event: React.KeyboardEvent, onActivate: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function formatCure(cure?: string) {
  return cure?.trim() || '—'
}

function getDiseaseListSubtitle(
  disease: Disease,
  symptomOptions: Pick<MedicineFlagOption, 'value' | 'label'>[]
) {
  const labels = resolveSymptomLabels(disease.symptoms, symptomOptions)
  if (labels.length) return labels.join(', ')
  return formatCure(disease.cure)
}

function DiseaseRowActions({
  disease,
  onView,
  onDelete,
}: {
  disease: Disease
  onView: (disease: Disease) => void
  onDelete: (disease: Disease) => void
}) {
  const { hasPermission } = usePermission()
  const canDelete = hasPermission('medicines', 'delete')
  return (
    <div
      className="clinic-table-actions flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action h-8 w-8"
        aria-label={t('diseases.viewDisease', { name: disease.name })}
        onClick={() => onView(disease)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="clinic-table-action clinic-table-action-delete h-8 w-8"
          aria-label={t('diseases.deleteDiseaseAction', { name: disease.name })}
          onClick={() => onDelete(disease)}
        >
          <Trash2 className="h-4 w-4" />
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
  field: DiseaseSortField
  sortField: DiseaseSortField
  sortDirection: DiseaseSortDirection
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-exams))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-exams))]" />
  )
}

export function DiseasesDataTable({
  diseases,
  symptomOptions = [],
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
}: DiseasesDataTableProps) {
  const start = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalFiltered)
  const showSkeleton = loading && diseases.length === 0

  if (viewMode === 'compact') {
    return (
      <div className="space-y-3">
        <div
          className={cn('clinic-compact-grid', refreshing && 'pointer-events-none opacity-60')}
          key={page}
          aria-busy={loading || undefined}
        >
          {showSkeleton ? (
            <div className="col-span-full">
              <DiseasesCompactSkeleton rows={pageSize} />
            </div>
          ) : diseases.length === 0 ? (
            <div className="clinic-table-empty col-span-full">{t('diseases.listEmpty')}</div>
          ) : (
            diseases.map((disease) => (
              <div
                key={disease.id}
                role="button"
                tabIndex={0}
                className="clinic-compact-card clinic-compact-card-clickable group cursor-pointer"
                onClick={() => onView(disease)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(disease))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="diseases-avatar flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{disease.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getDiseaseListSubtitle(disease, symptomOptions)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <DiseaseRowActions disease={disease} onView={onView} onDelete={onDelete} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="clinic-table-shell overflow-hidden rounded-[20px] border">
          <DiseasesPagination
            page={page}
            totalPages={totalPages}
            start={start}
            end={end}
            totalFiltered={totalFiltered}
            onPageChange={onPageChange}
            loading={showSkeleton}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'clinic-table-shell overflow-hidden rounded-[20px] border',
        refreshing && 'pointer-events-none opacity-60'
      )}
      aria-busy={loading || undefined}
    >
      <table className="clinic-table w-full">
        <thead>
          <tr className="clinic-table-head">
            <th>
              <button
                type="button"
                className="clinic-table-sort-btn"
                onClick={() => onSort('name')}
                disabled={loading}
              >
                {t('diseases.diseaseName')}
                <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th>
              <button
                type="button"
                className="clinic-table-sort-btn"
                onClick={() => onSort('symptoms')}
                disabled={loading}
              >
                {t('diseases.form.symptoms')}
                <SortIcon field="symptoms" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th>
              <button
                type="button"
                className="clinic-table-sort-btn"
                onClick={() => onSort('cure')}
                disabled={loading}
              >
                {t('diseases.form.cure')}
                <SortIcon field="cure" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th className="w-[4.5rem] text-right">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody key={page}>
          {showSkeleton ? (
            <DiseasesTableSkeleton rows={pageSize} />
          ) : diseases.length === 0 ? (
            <tr>
              <td colSpan={4} className="clinic-table-empty">
                {t('diseases.listEmpty')}
              </td>
            </tr>
          ) : (
            diseases.map((disease) => (
              <tr
                key={disease.id}
                tabIndex={0}
                className="clinic-table-row clinic-table-row-clickable group cursor-pointer"
                onClick={() => onView(disease)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(disease))}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="diseases-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Activity className="h-4 w-4" />
                    </div>
                    <p className="truncate font-medium text-foreground">{disease.name}</p>
                  </div>
                </td>
                <td>
                  <DiseaseSymptomBadges
                    symptoms={disease.symptoms}
                    symptomOptions={symptomOptions}
                    maxVisible={3}
                  />
                </td>
                <td>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {formatCure(disease.cure)}
                  </span>
                </td>
                <td>
                  <DiseaseRowActions disease={disease} onView={onView} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <DiseasesPagination
        page={page}
        totalPages={totalPages}
        start={start}
        end={end}
        totalFiltered={totalFiltered}
        onPageChange={onPageChange}
        loading={showSkeleton}
      />
    </div>
  )
}

function DiseasesPagination({
  page,
  totalPages,
  start,
  end,
  totalFiltered,
  onPageChange,
  loading,
}: {
  page: number
  totalPages: number
  start: number
  end: number
  totalFiltered: number
  onPageChange: (page: number) => void
  loading?: boolean
}) {
  return (
    <div className="clinic-pagination flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {loading ? (
          <Skel className="h-3.5 w-40" />
        ) : totalFiltered === 0
          ? t('diseases.noResults')
          : t('diseases.listPagination', { start, end, total: totalFiltered })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={loading || page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages })
          .slice(0, 5)
          .map((_, i) => {
            const pageNum = i + 1
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8 w-8 p-0 text-xs', pageNum === page && 'diseases-page-btn-active')}
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
          disabled={loading || page >= totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
