'use client'

import dynamic from 'next/dynamic'
import { BentoGrid, BentoCard } from '@/components/shared'
import {
  InventoryHero,
  InventoryRecordPanel,
  InventoryStatSkeleton,
  InventoryStatsCards,
} from '@/components/inventory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInventoryPage } from '@/hooks/use-inventory-page'

const InventoryHistoryPanel = dynamic(
  () =>
    import('@/components/inventory/inventory-history-panel').then((mod) => ({
      default: mod.InventoryHistoryPanel,
    })),
  { ssr: false }
)

export default function AttendancePage() {
  const {
    classes,
    classId,
    setClassId,
    date,
    setDate,
    patients,
    statuses,
    summary,
    histClass,
    setHistClass,
    histPatient,
    setHistPatient,
    tab,
    setTab,
    stats,
    rosterLoading,
    loadingSummary,
    saving,
    refreshing,
    refresh,
    save,
    loadSummary,
    setStatus,
    bulkMark,
  } = useInventoryPage()

  return (
    <div className="dashboard-shell attendance-page space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <InventoryHero
            present={stats.present}
            total={stats.total}
            onRefresh={refresh}
            onSave={save}
            refreshing={refreshing}
            saving={saving}
          />
        </BentoCard>

        {rosterLoading ? <InventoryStatSkeleton /> : <InventoryStatsCards stats={stats} />}

        <BentoCard colSpan={12} delay={300}>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as 'record' | 'history')}
            className="attendance-tabs"
          >
            <TabsList className="attendance-tabs-list mb-4">
              <TabsTrigger value="record" className="attendance-tab-trigger">
                {'Record'}
              </TabsTrigger>
              <TabsTrigger value="history" className="attendance-tab-trigger">
                {'History'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record">
              {tab === 'record' && (
                <InventoryRecordPanel
                  date={date}
                  classId={classId}
                  classes={classes}
                  patients={patients}
                  statuses={statuses}
                  stats={stats}
                  loading={rosterLoading}
                  onDateChange={setDate}
                  onClassChange={setClassId}
                  onStatusChange={setStatus}
                  onBulkMark={bulkMark}
                />
              )}
            </TabsContent>

            <TabsContent value="history">
              {tab === 'history' && (
                <InventoryHistoryPanel
                  histClass={histClass}
                  histPatient={histPatient}
                  classes={classes}
                  summary={summary}
                  loading={loadingSummary}
                  onClassChange={setHistClass}
                  onPatientChange={setHistPatient}
                  onLoad={loadSummary}
                />
              )}
            </TabsContent>
          </Tabs>
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
