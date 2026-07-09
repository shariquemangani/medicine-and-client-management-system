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
import { BentoGrid, BentoCard } from '@/components/shared'

export default function DiseasesListPage() {
  const router = useRouter()
  const {
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
    } catch {
      toast.error(t('diseases.deleteFailed'))
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="disease-vault-page dashboard-shell space-y-4" aria-busy="true">
        <div className="dashboard-skeleton h-28 rounded-2xl" />
        <div className="dashboard-skeleton h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="disease-vault-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <DiseasesHero
            total={stats.total}
            onRefresh={reload}
            refreshing={refreshing}
            onAdd={() => router.push(ROUTES.vaultDiseaseNew)}
          />
        </BentoCard>

        <BentoCard colSpan={12} delay={120}>
          <DiseasesFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            totalFiltered={totalFiltered}
            total={stats.total}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <div className="mt-4">
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
        </BentoCard>
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
