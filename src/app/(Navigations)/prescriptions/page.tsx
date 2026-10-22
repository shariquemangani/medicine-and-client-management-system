'use client'

import { useState } from 'react'
import { FileText, BookOpen, Users, CheckCircle } from 'lucide-react'
import { BentoGrid, BentoCard, AnimatedStat } from '@/components/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PrescriptionsHero,
  PrescriptionsFilters,
  PrescriptionsDataTable,
  PrescriptionsCreateDialog,
  PrescriptionsResultDialog,
  PrescriptionItemsPanel,
  PrescriptionsResultsPanel,
  type PrescriptionFormValues,
} from '@/components/prescriptions'
import { PendingStat } from '@/components/inventory'
import { usePrescriptionsDirectory } from '@/hooks/use-prescriptions-directory'
import { usePrescriptionsMarks } from '@/hooks/use-prescription-items'
import { createPrescription } from '@/services/pharmacy-api'
import type { Prescription, PrescriptionItem } from '@/types'
import { t } from '@/lib/labels'
import { toast } from 'sonner'

export default function PrescriptionsPage() {
  const [tab, setTab] = useState<'prescriptions' | 'marks' | 'results'>('prescriptions')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<PrescriptionItem | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table')

  const {
    allPrescriptions,
    initialLoading,
    refreshing,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    availableTerms,
    paginatedPrescriptions,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered,
    reload,
  } = usePrescriptionsDirectory()

  const {
    classes,
    selectedPrescription,
    setSelectedPrescription,
    selectedClass,
    setSelectedClass,
    patients,
    marks,
    results,
    selectedPrescriptionData,
    passCount,
    loadingRoster,
    saving,
    saveMarks,
    handleMarkChange,
    enterMarks,
  } = usePrescriptionsMarks({
    allPrescriptions,
    enabled: true,
    t,
  })

  const handleEnterMarks = (exam: Prescription) => {
    enterMarks(exam)
    if (exam.classIds.length > 0 && !selectedClass) {
      setSelectedClass(exam.classIds[0])
    }
    setTab('marks')
  }

  const handleCreatePrescription = async (values: PrescriptionFormValues) => {
    try {
      await createPrescription({
        name: values.name.trim(),
        term: values.term,
        academicYear: values.academicYear.trim(),
        subjects: values.subjects
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        maxScore: values.maxScore,
        passScore: values.passScore,
        classIds: values.classIds,
      })
      toast.success(t('prescriptions.created'))
      await reload()
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('prescriptions.createFailed'))
      throw new Error('create failed')
    }
  }

  return (
    <div className="prescriptions-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <PrescriptionsHero
            total={initialLoading ? null : stats.total}
            subjects={initialLoading ? null : stats.subjects}
            onRefresh={reload}
            onCreate={() => setCreateOpen(true)}
            refreshing={refreshing}
          />
        </BentoCard>

        {refreshing || initialLoading ? (
          <>
            <BentoCard colSpan={3} accent="prescriptions" delay={0}>
              <PendingStat title={t('prescriptions.totalPrescriptions')} icon={FileText} accent="prescriptions" />
            </BentoCard>
            <BentoCard colSpan={3} accent="medicines" delay={0}>
              <PendingStat title={t('prescriptions.totalSubjects')} icon={BookOpen} accent="medicines" />
            </BentoCard>
            <BentoCard colSpan={3} accent="patients" delay={0}>
              <PendingStat title={t('prescriptions.linkedMedicines')} icon={Users} accent="patients" />
            </BentoCard>
            <BentoCard colSpan={3} accent="fees" delay={0}>
              <PendingStat title={t('prescriptions.passedPatients')} icon={CheckCircle} accent="fees" />
            </BentoCard>
          </>
        ) : (
          <>
            <BentoCard colSpan={3} accent="prescriptions" delay={60}>
              <AnimatedStat
                title={t('prescriptions.totalPrescriptions')}
                value={stats.total}
                icon={FileText}
                accent="prescriptions"
              />
            </BentoCard>

            <BentoCard colSpan={3} accent="medicines" delay={120}>
              <AnimatedStat
                title={t('prescriptions.totalSubjects')}
                value={stats.subjects}
                icon={BookOpen}
                accent="medicines"
              />
            </BentoCard>

            <BentoCard colSpan={3} accent="patients" delay={180}>
              <AnimatedStat
                title={t('prescriptions.linkedMedicines')}
                value={stats.classes}
                icon={Users}
                accent="patients"
              />
            </BentoCard>

            <BentoCard colSpan={3} accent="fees" delay={240}>
              <AnimatedStat
                title={t('prescriptions.passedPatients')}
                value={passCount}
                icon={CheckCircle}
                accent="fees"
              />
            </BentoCard>
          </>
        )}

        <BentoCard colSpan={12} delay={300}>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as typeof tab)}
            className="attendance-tabs"
          >
            <TabsList className="attendance-tabs-list mb-4">
              <TabsTrigger value="prescriptions" className="attendance-tab-trigger">
                {t('prescriptions.tabPrescriptions')}
              </TabsTrigger>
              <TabsTrigger value="marks" className="attendance-tab-trigger">
                {t('prescriptions.tabMarks')}
              </TabsTrigger>
              <TabsTrigger value="results" className="attendance-tab-trigger">
                {t('prescriptions.tabResults')}
                {initialLoading ? (
                  <span
                    className="animate-pulse ml-1.5 inline-block h-4 w-5 rounded-full bg-muted align-middle"
                    aria-hidden
                  />
                ) : results.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-[hsl(var(--metric-exams))]/15 px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--metric-exams))]">
                    {results.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prescriptions">
              {tab === 'prescriptions' && (
                <div className="space-y-4">
                  <PrescriptionsFilters
                    filters={filters}
                    onFilterChange={updateFilter}
                    onClear={clearFilters}
                    activeFilterCount={activeFilterCount}
                    availableTerms={availableTerms}
                    totalFiltered={totalFiltered}
                    total={allPrescriptions.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    loading={initialLoading}
                  />
                  <PrescriptionsDataTable
                    exams={paginatedPrescriptions}
                    loading={initialLoading}
                    refreshing={refreshing}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                    onEnterMarks={handleEnterMarks}
                    page={page}
                    totalPages={totalPages}
                    totalFiltered={totalFiltered}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    viewMode={viewMode}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="marks">
              {tab === 'marks' && (
                <PrescriptionItemsPanel
                  exams={allPrescriptions}
                  classes={classes}
                  selectedPrescription={selectedPrescription}
                  selectedClass={selectedClass}
                  patients={patients}
                  marks={marks}
                  exam={selectedPrescriptionData}
                  loading={loadingRoster}
                  saving={saving}
                  onPrescriptionChange={setSelectedPrescription}
                  onClassChange={setSelectedClass}
                  onMarkChange={handleMarkChange}
                  onSave={saveMarks}
                />
              )}
            </TabsContent>

            <TabsContent value="results">
              {tab === 'results' && (
                <PrescriptionsResultsPanel
                  results={results}
                  loading={loadingRoster}
                  onView={(item) => setSelectedResult(item)}
                />
              )}
            </TabsContent>
          </Tabs>
        </BentoCard>
      </BentoGrid>

      <PrescriptionsCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classes={classes}
        onSubmit={handleCreatePrescription}
      />

      <PrescriptionsResultDialog
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  )
}
