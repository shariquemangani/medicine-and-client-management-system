'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Wallet } from 'lucide-react'
import { BentoGrid, BentoCard, AnimatedStat } from '@/components/shared'
import {
  PatientsHero,
  PatientsFilters,
  PatientsDataTable,
  PatientsDeleteDialog,
  PatientsStatSkeleton,
} from '@/components/patients'
import { usePatientsDirectory } from '@/hooks/use-patients-directory'
import { deletePatientApi } from '@/services/patient-api'
import type { Patient } from '@/types'
import { toast } from 'sonner'

export default function PatientsPage() {
  const router = useRouter()
  const {
    initialLoading,
    refreshing,
    error,
    filters,
    searchInput,
    setSearchInput,
    applySearch,
    clearSearch,
    searchHighlight,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    paginatedPatients,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered,
    availableYears,
    reload,
  } = usePatientsDirectory()

  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table')

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePatientApi(deleteTarget.id)
      setDeleteTarget(null)
      await reload()
      toast.success('Patient deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete patient')
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="dashboard-shell patients-page space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <PatientsHero
            total={stats.total}
            active={stats.total}
            onRefresh={reload}
            refreshing={refreshing}
          />
        </BentoCard>

        {initialLoading ? (
          <PatientsStatSkeleton />
        ) : (
          <>
            <BentoCard colSpan={6} accent="patients" delay={60}>
              <AnimatedStat
                title="Total Patients"
                value={stats.total}
                icon={Users}
                accent="patients"
                compact
              />
            </BentoCard>
            <BentoCard colSpan={6} accent="fees" delay={120}>
              <AnimatedStat
                title="Total Amount"
                value={stats.totalAmount}
                icon={Wallet}
                accent="fees"
                currency
                compact
              />
            </BentoCard>
          </>
        )}

        <BentoCard colSpan={12} delay={300}>
          <PatientsFilters
            filters={filters}
            searchInput={searchInput}
            searchHighlight={searchHighlight}
            onSearchInputChange={setSearchInput}
            onSearchSubmit={applySearch}
            onSearchClear={clearSearch}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            availableYears={availableYears}
            totalFiltered={totalFiltered}
            total={stats.total}
            totalAmount={stats.totalAmount}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <div className="mt-4">
            <PatientsDataTable
              patients={paginatedPatients}
              loading={initialLoading}
              refreshing={refreshing || deleting}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              onView={(patient) => router.push(`/patients/${patient.id}`)}
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

      <PatientsDeleteDialog
        patient={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  )
}
