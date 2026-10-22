'use client'

import { useEffect, useState } from 'react'
import { useAppSelector } from '@/redux'
import { Sparkles, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { t } from '@/lib/labels'
import { PageHero } from '@/components/shared/page-hero'

export function DashboardHero() {
  const { user } = useAppSelector((s) => s.auth)
  const firstName = user?.name?.split(' ')[0] ?? 'Admin'
  // Date and greeting depend on the visitor's clock, so they are filled in after mount.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])
  const today = now ? format(now, 'EEEE, MMMM d') : ' '
  const hour = now?.getHours() ?? null
  const greeting =
    hour === null
      ? 'Welcome back'
      : t(hour < 12 ? 'dashboard.goodMorning' : hour < 17 ? 'dashboard.goodAfternoon' : 'dashboard.goodEvening')

  return (
    <PageHero
      icon={Sparkles}
      badge="Live overview"
      title={`${greeting}, ${firstName}`}
      subtitle="Here's what's happening in your MediFlow workspace today."
      actions={
        <div className="page-hero-btn flex h-8 items-center gap-2 rounded-xl px-3 text-xs">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="min-w-[8rem]">{today}</span>
        </div>
      }
    />
  )
}
