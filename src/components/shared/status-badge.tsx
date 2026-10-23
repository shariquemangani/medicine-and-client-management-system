import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'graduated'
  | 'archived'
  | 'pending'
  | 'overdue'
  | 'pass'
  | 'fail'
  | 'present'
  | 'absent'
  | 'late'

const variantStyles: Record<StatusVariant, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  inactive: 'bg-muted text-muted-foreground border-border',
  graduated: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  archived: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  overdue: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  pass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  fail: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  present: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  absent: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  late: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
}

const statusLabelKeys: Partial<Record<StatusVariant, string>> = {
  active: 'status.active',
  inactive: 'status.inactive',
  graduated: 'status.graduated',
  archived: 'status.archived',
  present: 'dashboard.present',
  absent: 'dashboard.absent',
}

interface StatusBadgeProps {
  status: StatusVariant
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const displayLabel = label ?? (statusLabelKeys[status] ? t(statusLabelKeys[status]!) : status)

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', variantStyles[status], className)}
    >
      {displayLabel}
    </Badge>
  )
}
