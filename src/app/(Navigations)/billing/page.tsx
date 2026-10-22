'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Wallet, DollarSign, AlertCircle, Users } from 'lucide-react'
import { BentoGrid, BentoCard } from '@/components/shared'
import { BillingHero, BillingBalancesPanel, BillingCategoriesPanel, StatCardContent } from '@/components/billing'
import type { BillingPaymentForm } from '@/components/billing/billing-payment-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBillingPage } from '@/hooks/use-billing-page'
import { recordPayment } from '@/services/pharmacy-api'
import type { PatientBillingSummary } from '@/types'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/download-csv'

const BillingPaymentDialog = dynamic(
  () => import('@/components/billing/billing-payment-dialog').then((m) => m.BillingPaymentDialog),
  { ssr: false }
)

export default function BillingPage() {
  const {
    stats,
    filteredSummaries,
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
    if (!Number.isFinite(payForm.amount) || payForm.amount <= 0) {
      toast.error('Enter an amount greater than 0')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payForm.date) || Number.isNaN(new Date(payForm.date).getTime())) {
      toast.error('Choose a valid payment date')
      return
    }
    if (payForm.amount > selected.balance) {
      toast.error(`Amount exceeds the outstanding balance of ₹${selected.balance.toLocaleString('en-IN')}`)
      return
    }
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
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const exportBalances = () => {
    if (filteredSummaries.length === 0) {
      toast.error('No accounts to export')
      return
    }
    const rows = [
      ['Patient', 'Roll No', 'Category', 'Due', 'Paid', 'Balance', 'Last Payment'],
      ...filteredSummaries.map((r) => [
        r.patientName,
        r.rollNumber,
        r.className,
        r.totalDue,
        r.totalPaid,
        r.balance,
        r.lastPaymentDate ?? '',
      ]),
    ]
    downloadCsv(`billing-balances-${new Date().toISOString().split('T')[0]}.csv`, rows)
  }

  return (
    <div className="dashboard-shell fees-page space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <BillingHero
            loading={initialLoading}
            totalAccounts={stats.totalAccounts}
            outstanding={stats.totalDue}
            onRefresh={reload}
            onExport={exportBalances}
            refreshing={refreshing}
          />
        </BentoCard>

        <BentoCard colSpan={3} accent="fees" delay={0}>
          <StatCardContent
            title="Total Accounts"
            badge="Accounts"
            icon={Users}
            accent="fees"
            value={stats.totalAccounts}
            loading={initialLoading}
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="fees" delay={0}>
          <StatCardContent
            title="Outstanding Balance"
            badge="Due"
            icon={Wallet}
            accent="fees"
            value={stats.totalDue}
            loading={initialLoading}
            currency
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="medicines" delay={0}>
          <StatCardContent
            title="Total Collected"
            badge="Paid"
            icon={DollarSign}
            accent="medicines"
            value={stats.totalCollected}
            loading={initialLoading}
            currency
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="prescriptions" delay={0}>
          <StatCardContent
            title="Overdue Accounts"
            badge="Overdue"
            icon={AlertCircle}
            accent="prescriptions"
            value={stats.overdueCount}
            loading={initialLoading}
          />
        </BentoCard>

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
