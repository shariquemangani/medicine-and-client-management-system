'use client'

import { useEffect, useState } from 'react'
import { useAppSelector } from '@/redux'
import { Sparkles, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { t } from '@/lib/labels'

export function DashboardHero() {
  const { user } = useAppSelector((s) => s.auth)
  const firstName = user?.name?.split(' ')[0] ?? 'Admin'
  // The date and greeting depend on the visitor's clock/timezone, so they are filled in after
  // mount; rendering them on the server would bake the build-time value into the HTML.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])
  const today = now ? format(now, 'EEEE, MMMM d') : ' '
  const hour = now?.getHours() ?? null
  const greeting =
    hour === null
      ? 'Welcome back'
      : t(hour < 12 ? 'dashboard.goodMorning' : hour < 17 ? 'dashboard.goodAfternoon' : 'dashboard.goodEvening')

  return (
    <div className="dashboard-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="dashboard-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary dark:border-primary/25 dark:bg-primary/10 dark:text-primary">
            <Sparkles className="h-3 w-3" />
            {'Live overview'}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{"Here's what's happening in your MediFlow workspace today."}</p>
        </div>
        <div className="dashboard-hero-date flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-[9rem]">{today}</span>
        </div>
      </div>
    </div>
  )
}
