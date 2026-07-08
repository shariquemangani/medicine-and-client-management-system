'use client'

import { useEffect, useState } from 'react'
import {
  GraduationCap,
  BookOpen,
  Wallet,
  FileText,
  ClipboardCheck,
} from 'lucide-react'
import { BentoGrid, BentoCard, AnimatedStat } from '@/components/shared'
import {
  DashboardHero,
  DashboardPatientTrendChart,
  DashboardActivityFeed,
  DashboardStockGauge,
  DashboardQuickActions,
  DashboardSkeleton,
} from '@/components/dashboard'
import { getDashboardStats } from '@/services/pharmacy-api'
import type { DashboardData } from '@/types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const { stats, enrollmentTrend, recentActivities } = data

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className='!p-0'>
          <DashboardHero />
        </BentoCard>

        <BentoCard colSpan={3} accent="patients" delay={60}>
          <AnimatedStat
            title={'Total Patients'}
            value={stats.totalPatients}
            icon={GraduationCap}
            accent="patients"
            trend={8}
            compact
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="prescriptions" delay={120}>
          <AnimatedStat
            title="Purchase Records"
            value={stats.totalClasses}
            icon={FileText}
            accent="prescriptions"
            compact
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="medicines" delay={180}>
          <AnimatedStat
            title={'Active Medicines'}
            value={stats.totalClasses}
            icon={BookOpen}
            accent="medicines"
            compact
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="fees" delay={240}>
          <AnimatedStat
            title={'Billing This Month'}
            value={stats.feesCollectedThisMonth}
            icon={Wallet}
            accent="fees"
            currency
            trend={15}
            compact
          />
        </BentoCard>

        <BentoCard colSpan={8} rowSpan={2} delay={300}>
          <DashboardPatientTrendChart data={enrollmentTrend} />
        </BentoCard>
        <BentoCard colSpan={4} accent="inventory" delay={360}>
          <DashboardStockGauge rate={stats.attendanceRateToday} />
        </BentoCard>
        <BentoCard colSpan={4} accent="prescriptions" delay={420}>
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: 'hsl(var(--metric-prescriptions) / 0.12)',
                  color: 'hsl(var(--metric-prescriptions))',
                }}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{'Upcoming Prescriptions'}</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">3</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                'Mid-Term Science',
                'Math Finals',
                'English Oral',
              ].map((exam) => (
                <div
                  key={exam}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs dark:bg-muted/20"
                >
                  <span className="font-medium text-foreground">{exam}</span>
                  <span className="text-muted-foreground">{'Soon'}</span>
                </div>
              ))}
            </div>
          </div>
        </BentoCard>

        <BentoCard colSpan={7} rowSpan={2} delay={480}>
          <DashboardActivityFeed activities={recentActivities} />
        </BentoCard>
        <BentoCard colSpan={5} delay={540}>
          <DashboardQuickActions />
        </BentoCard>
        <BentoCard colSpan={5} accent="inventory" delay={600}>
          <div className="flex h-full items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'hsl(var(--metric-inventory) / 0.12)',
                color: 'hsl(var(--metric-inventory))',
              }}
            >
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{'Inventory Status'}</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.attendanceRateToday >= 90 ? 'On Track' : 'Needs Review'}
              </p>
              <p className="text-xs text-muted-foreground">
                {`${stats.totalPatients} patients across ${stats.totalClasses} classes`}
              </p>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
