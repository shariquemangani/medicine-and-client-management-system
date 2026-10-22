'use client'

import { ROUTES } from '@/lib/routes'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DiseasesHero,
  DiseasesFilters,
  DiseasesDataTable,
  DiseasesDeleteDialog,
} from '@/components/diseases'
import { useDiseasesDirectory } from '@/hooks/use-diseases-directory'
import { useDiseaseFlagOptions } from '@/hooks/use-disease-flag-options'
import { deleteDisease } from '@/services/disease-api'
import type { Disease } from '@/types/disease'
import { t } from '@/lib/labels'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/download-csv'
import { BentoGrid, BentoCard } from '@/components/shared'

export default function DiseasesListPage() {
  const router = useRouter()
  const {
    filteredDiseases,
    initialLoading,
    refreshing,
    error,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    paginatedDiseases,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered,
    reload,
  } = useDiseasesDirectory()
  const { symptoms: symptomOptions } = useDiseaseFlagOptions()

  const exportRows = () => {
    if (filteredDiseases.length === 0) {
      toast.error('No diseases to export')
      return
    }
    downloadCsv(`diseases-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Name', 'Symptoms', 'Cure', 'Diet', 'Precautions'],
      ...filteredDiseases.map((d) => [
        d.name,
        (d.symptoms ?? []).join('; '),
        d.cure ?? '',
        d.diet ?? '',
        d.precautions ?? '',
      ]),
    ])
  }

  const [deleteTarget, setDeleteTarget] = useState<Disease | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table')

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const openView = (disease: Disease) => {
    router.push(ROUTES.vaultDiseaseDetail(disease.id))
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDisease(deleteTarget.id)
      toast.success(t('diseases.deleted'))
      setDeleteTarget(null)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('diseases.deleteFailed'))
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="disease-vault-page dashboard-shell space-y-4">
      <BentoGrid>
        <div className="col-span-full">
          <DiseasesHero
            loading={initialLoading}
            onExport={exportRows}
            total={stats.total}
            onRefresh={reload}
            refreshing={refreshing}
            onAdd={() => router.push(ROUTES.vaultDiseaseNew)}
          />
        </div>

        <div className="col-span-12 min-w-0">
          <div className="space-y-4">
          <DiseasesFilters
            loading={initialLoading}
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            totalFiltered={totalFiltered}
            total={stats.total}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <div>
            <DiseasesDataTable
              diseases={paginatedDiseases}
              symptomOptions={symptomOptions}
              loading={initialLoading}
              refreshing={refreshing}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              onView={openView}
              onDelete={setDeleteTarget}
              page={page}
              totalPages={totalPages}
              totalFiltered={totalFiltered}
              pageSize={pageSize}
              onPageChange={setPage}
              viewMode={viewMode}
            />
          </div>
          </div>
        </div>
      </BentoGrid>

      <DiseasesDeleteDialog
        target={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  )
}
