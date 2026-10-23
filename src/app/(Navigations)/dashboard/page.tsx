'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Package,
  BookOpen,
  Wallet,
  FileText,
  ClipboardCheck,
} from 'lucide-react'
import { BentoGrid, BentoCard, CardHeader } from '@/components/shared'
import { useAppDispatch, useAppSelector } from '@/redux'
import { loadStockData } from '@/redux/slices/stockSlice'
import {
  DashboardHero,
  DashboardActivityFeed,
  DashboardStockGauge,
  DashboardQuickActions,
  DashboardStatTile,
  DashboardTrendCard,
  Sk,
} from '@/components/dashboard'
import { getDashboardStats } from '@/services/pharmacy-api'
import { getStockLevelStatus } from '@/lib/stock-utils'
import type { DashboardData } from '@/types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading: authLoading } = useAppSelector((st) => st.auth)
  // Stock comes from the shared Redux store (the sidebar already loads it), not a second read.
  const stockItems = useAppSelector((st) => st.stock.items)
  const stockStats = useAppSelector((st) => st.stock.stats)
  const stockError = useAppSelector((st) => st.stock.error)
  const stockLoading = !stockStats && !stockError
  const stockItemCount = stockItems.length
  const stockRate =
    stockItems.length === 0
      ? null
      : Math.round(
          // Healthy = enough in-date stock (expired batches do not count), same rule as the inventory page.
          (stockItems.filter((i) => ['healthy', 'overstocked'].includes(getStockLevelStatus(i))).length /
            stockItems.length) *
            100
        )

  const load = useCallback(() => {
    setLoading(true)
    setFailed(false)
    getDashboardStats()
      .then(setData)
      .catch((error) => {
        console.error(error)
        setFailed(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void dispatch(loadStockData())
  }, [dispatch, authLoading, isAuthenticated])

  if (failed || (!loading && !data)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center" role="alert">
        <h1 className="text-lg font-semibold text-foreground">{"Couldn't load the dashboard"}</h1>
        <p className="text-sm text-muted-foreground">{'Check your connection and try again.'}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {'Retry'}
        </button>
      </div>
    )
  }

  const stats = data?.stats ?? null
  const showStaff = stats ? stats.totalStaffs !== null : user?.role === 'super_admin'
  const dataReady = !loading && !!data
  const staffValue = stats ? (stats.totalStaffs ?? (stockLoading ? null : stockItemCount)) : null

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <div className="col-span-full">
          <DashboardHero />
        </div>

        <BentoCard colSpan={3} accent="patients" delay={60}>
          <DashboardStatTile title={'Total Patients'} value={stats?.totalPatients ?? null} icon={Users} accent="patients" />
        </BentoCard>
        <BentoCard colSpan={3} accent="prescriptions" delay={120}>
          <DashboardStatTile
            title={showStaff ? 'Staff Members' : 'Stock Items'}
            badge={showStaff ? 'Team' : 'Stock'}
            value={staffValue}
            icon={showStaff ? Users : Package}
            accent="prescriptions"
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="medicines" delay={180}>
          <DashboardStatTile title={'Medicines in Vault'} value={stats?.totalClasses ?? null} icon={BookOpen} accent="medicines" />
        </BentoCard>
        <BentoCard colSpan={3} accent="fees" delay={240}>
          <DashboardStatTile
            title={'Billing This Month'}
            value={stats?.feesCollectedThisMonth ?? null}
            icon={Wallet}
            accent="fees"
            currency
          />
        </BentoCard>

        <BentoCard colSpan={8} rowSpan={2} delay={300}>
          <DashboardTrendCard data={data?.enrollmentTrend ?? null} />
        </BentoCard>
        <BentoCard colSpan={4} accent="inventory" delay={360}>
          <DashboardStockGauge rate={stockRate} loading={stockLoading} />
        </BentoCard>
        <BentoCard colSpan={4} accent="prescriptions" delay={420}>
          <div className="flex h-full flex-col justify-between" aria-busy={!dataReady || undefined}>
            <CardHeader
              title="Clinic Snapshot"
              description="Key counts at a glance"
              icon={FileText}
              accent="prescriptions"
              ornament={false}
            />
            <dl className="space-y-2">
              {[
                ['Active patients', stats?.totalPatients ?? null],
                ['Medicines in vault', stats?.totalClasses ?? null],
                ...(showStaff ? [['Staff members', stats?.totalStaffs ?? null]] : []),
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs dark:bg-muted/20"
                >
                  <dt className="font-medium text-foreground">{label}</dt>
                  <dd className="tabular-nums text-muted-foreground">{value === null ? <Sk className="h-4 w-8" /> : value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </BentoCard>

        <BentoCard colSpan={7} rowSpan={2} delay={480}>
          <DashboardActivityFeed activities={data?.recentActivities ?? []} loading={!dataReady} />
        </BentoCard>
        <BentoCard colSpan={5} delay={540}>
          <DashboardQuickActions />
        </BentoCard>
        <BentoCard colSpan={5} accent="inventory" delay={600}>
          <div className="flex h-full flex-col justify-between" aria-busy={!dataReady || undefined}>
            <CardHeader title="Clinic Status" description="Overall readiness" icon={ClipboardCheck} accent="inventory" ornament={false} />
            <div>
              {stats ? (
                <>
                  <p className="text-lg font-semibold text-foreground">
                    {stats.totalClasses > 0 ? 'Vault ready' : 'Add medicines to the vault'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {`${stats.totalPatients} patients · ${stats.totalClasses} medicines in vault`}
                  </p>
                </>
              ) : (
                <div className="mt-1 space-y-2">
                  <Sk className="h-6 w-32" />
                  <Sk className="h-3 w-48" />
                </div>
              )}
            </div>
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
