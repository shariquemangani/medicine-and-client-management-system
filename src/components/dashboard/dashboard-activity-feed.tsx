'use client'

import type { RecentActivity } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Activity, BookOpen, ClipboardCheck, GraduationCap, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ActivityVisual = { icon: LucideIcon; accent: string }

const activityConfig: Record<RecentActivity['type'], ActivityVisual> = {
  patient_added: { icon: GraduationCap, accent: '--metric-patients' },
  staff_added: { icon: Users, accent: '--metric-staff' },
  attendance_updated: { icon: ClipboardCheck, accent: '--metric-inventory' },
  exam_results: { icon: BookOpen, accent: '--metric-prescriptions' },
  payment_received: { icon: Wallet, accent: '--metric-billing' },
}

const defaultActivityVisual: ActivityVisual = {
  icon: Activity,
  accent: '--metric-patients',
}

function getActivityVisual(type: string): ActivityVisual {
  return activityConfig[type as RecentActivity['type']] ?? defaultActivityVisual
}

interface DashboardActivityFeedProps {
  activities: RecentActivity[]
}

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {

  return (
    <div className="flex h-full min-h-[240px] flex-col">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{'Recent Activity'}</h3>
          <p className="text-xs text-muted-foreground">{'Latest school events'}</p>
        </div>
      </div>
      <ul className="flex-1 space-y-1 overflow-auto pr-1">
        {activities.map((act, i) => {
          const config = getActivityVisual(act.type)
          const Icon = config.icon
          return (
            <li
              key={act.id}
              className="dashboard-activity-item group flex gap-3 rounded-xl p-2.5 transition-colors"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `hsl(var(${config.accent}) / 0.12)`,
                  color: `hsl(var(${config.accent}))`,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">{act.message}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
