'use client'

import { ROUTES } from '@/lib/routes'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MedicinesHero,
  MedicinesFilters,
  MedicinesDataTable,
  MedicinesDeleteDialog,
} from '@/components/medicines'
import { useMedicinesDirectory } from '@/hooks/use-medicines-directory'
import { deleteMedicine } from '@/services/pharmacy-api'
import type { Medicine } from '@/types'
import { t } from '@/lib/labels'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/download-csv'
import { BentoGrid } from '@/components/shared'

export default function MedicinesListPage() {
  const router = useRouter()
  const {
    medicines,
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
    paginatedMedicines,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered,
    reload,
  } = useMedicinesDirectory()

  const exportRows = () => {
    if (medicines.length === 0) {
      toast.error('No medicines to export')
      return
    }
    downloadCsv(`medicines-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Name', 'Common Name', 'Form', 'Status', 'Potencies', 'Symptoms'],
      ...medicines.map((m) => [
        m.name,
        m.commonName ?? '',
        m.formType ?? '',
        m.status ?? '',
        (m.potencies ?? []).join('; '),
        (m.symptoms ?? []).join('; '),
      ]),
    ])
  }

  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table')

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const openView = (medicine: Medicine) => {
    router.push(ROUTES.vaultMedicineDetail(medicine.id))
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMedicine(deleteTarget.id)
      toast.success(t('medicines.deleted'))
      setDeleteTarget(null)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('medicines.deleteFailed'))
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="medicine-vault-page dashboard-shell space-y-4">
      <BentoGrid>
        <div className="col-span-full">
          <MedicinesHero
            loading={initialLoading}
            onExport={exportRows}
            total={stats.total}
            active={stats.active}
            onRefresh={reload}
            refreshing={refreshing}
            onAdd={() => router.push(ROUTES.vaultMedicineNew)}
          />
        </div>

        <div className="col-span-12 min-w-0">
          <div className="space-y-4">
          <MedicinesFilters
            loading={initialLoading}
            medicines={medicines}
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
            <MedicinesDataTable
              medicines={paginatedMedicines}
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

      <MedicinesDeleteDialog
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
