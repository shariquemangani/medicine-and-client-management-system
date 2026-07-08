'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Wallet, DollarSign, AlertCircle, Users } from 'lucide-react'
import { BentoGrid, BentoCard, AnimatedStat } from '@/components/shared'
import { BillingHero, BillingStatSkeleton, BillingBalancesPanel } from '@/components/billing'
import type { BillingPaymentForm } from '@/components/billing/billing-payment-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBillingPage } from '@/hooks/use-billing-page'
import { recordPayment } from '@/services/pharmacy-api'
import type { PatientBillingSummary } from '@/types'
import { toast } from 'sonner'

const BillingCategoriesPanel = dynamic(
  () => import('@/components/billing/billing-categories-panel').then((m) => m.BillingCategoriesPanel),
  { ssr: false }
)

const BillingPaymentDialog = dynamic(
  () => import('@/components/billing/billing-payment-dialog').then((m) => m.BillingPaymentDialog),
  { ssr: false }
)

export default function BillingPage() {
  const {
    stats,
    paginatedSummaries,
    categories,
    categoriesLoading,
    initialLoading,
    refreshing,
    search,
    setSearch,
    overdueOnly,
    setOverdueFilter,
    activeTab,
    setActiveTab,
    page,
    setPage,
    totalPages,
    totalFiltered,
    start,
    end,
    pageSize,
    reload,
  } = useBillingPage()

  const [payDialog, setPayDialog] = useState(false)
  const [selected, setSelected] = useState<PatientBillingSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [payForm, setPayForm] = useState<BillingPaymentForm>({
    amount: 0,
    method: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const openPayDialog = (summary: PatientBillingSummary) => {
    setSelected(summary)
    setPayForm({
      amount: summary.balance,
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setPayDialog(true)
  }

  const submitPayment = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await recordPayment({
        patientId: selected.patientId,
        patientName: selected.patientName,
        amount: payForm.amount,
        method: payForm.method,
        date: payForm.date,
        notes: payForm.notes,
      })
      toast.success('Payment recorded')
      setPayDialog(false)
      await reload()
    } catch {
      toast.error('Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard-shell fees-page space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <BillingHero
            totalAccounts={stats.totalAccounts}
            outstanding={stats.totalDue}
            onRefresh={reload}
            refreshing={refreshing}
          />
        </BentoCard>

        {initialLoading ? (
          <BillingStatSkeleton />
        ) : (
          <>
            <BentoCard colSpan={3} accent="fees" delay={60}>
              <AnimatedStat
                title={'Total Accounts'}
                value={stats.totalAccounts}
                icon={Users}
                accent="fees"
                compact
              />
            </BentoCard>
            <BentoCard colSpan={3} accent="fees" delay={120}>
              <AnimatedStat
                title={'Outstanding Balance'}
                value={stats.totalDue}
                icon={Wallet}
                accent="fees"
                currency
                compact
              />
            </BentoCard>
            <BentoCard colSpan={3} accent="medicines" delay={180}>
              <AnimatedStat
                title={'Total Collected'}
                value={stats.totalCollected}
                icon={DollarSign}
                accent="medicines"
                currency
                compact
              />
            </BentoCard>
            <BentoCard colSpan={3} accent="prescriptions" delay={240}>
              <AnimatedStat
                title={'Overdue Accounts'}
                value={stats.overdueCount}
                icon={AlertCircle}
                accent="prescriptions"
                compact
              />
            </BentoCard>
          </>
        )}

        <BentoCard colSpan={12} delay={300}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="fees-tabs">
            <TabsList className="fees-tabs-list mb-4">
              <TabsTrigger value="balances" className="fees-tab-trigger">
                {'Balances'}
              </TabsTrigger>
              <TabsTrigger value="categories" className="fees-tab-trigger">
                {'Categories'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="balances">
              <BillingBalancesPanel
                summaries={paginatedSummaries}
                loading={initialLoading}
                search={search}
                onSearchChange={setSearch}
                overdueOnly={overdueOnly}
                onOverdueOnlyChange={setOverdueFilter}
                onPay={openPayDialog}
                page={page}
                totalPages={totalPages}
                totalFiltered={totalFiltered}
                start={start}
                end={end}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </TabsContent>
            <TabsContent value="categories">
              {activeTab === 'categories' && (
                <BillingCategoriesPanel categories={categories} loading={categoriesLoading} />
              )}
            </TabsContent>
          </Tabs>
        </BentoCard>
      </BentoGrid>

      {payDialog && (
        <BillingPaymentDialog
          open={payDialog}
          onOpenChange={setPayDialog}
          patient={selected}
          form={payForm}
          onFormChange={setPayForm}
          onSubmit={submitPayment}
          loading={submitting}
        />
      )}
    </div>
  )
}
