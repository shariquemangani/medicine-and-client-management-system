import type { RecentActivity } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Activity, BookOpen, ClipboardCheck, UserMinus, UserPen, UserPlus, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CardHeader } from '@/components/shared/card-header'
import { Sk } from './skeleton-bits'

type ActivityVisual = { icon: LucideIcon; accent: string }

const activityConfig: Record<RecentActivity['type'], ActivityVisual> = {
  patient_added: { icon: UserPlus, accent: '--metric-patients' },
  patient_updated: { icon: UserPen, accent: '--metric-patients' },
  patient_removed: { icon: UserMinus, accent: '--metric-patients' },
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
  loading?: boolean
}

export function DashboardActivityFeed({ activities, loading = false }: DashboardActivityFeedProps) {

  return (
    <div className="flex h-full min-h-[240px] flex-col" aria-busy={loading || undefined}>
      <CardHeader title="Recent Activity" description="Latest clinic events" icon={Activity} accent="patients" ornament={false} />
      {loading && (
        <div className="flex-1 space-y-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-2.5">
              <Sk className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Sk className="h-3.5 w-3/4" />
                <Sk className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && activities.length === 0 && (
        <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
          {'No activity yet. New patients and payments will show up here.'}
        </p>
      )}
      <ul className="flex-1 space-y-1 overflow-auto pr-1">
        {!loading && activities.map((act, i) => {
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
