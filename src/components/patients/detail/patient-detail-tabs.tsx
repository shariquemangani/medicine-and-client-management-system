'use client'

import { History, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PatientDetailTab = 'overview' | 'history'

interface PatientDetailTabsProps {
  activeTab: PatientDetailTab
  onTabChange: (tab: PatientDetailTab) => void
  historyCount?: number
  disabled?: boolean
}

const TABS: {
  id: PatientDetailTab
  label: string
  icon: typeof LayoutGrid
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'history', label: 'History', icon: History },
]

export function PatientDetailTabs({
  activeTab,
  onTabChange,
  historyCount = 0,
  disabled,
}: PatientDetailTabsProps) {
  return (
    <div className="patient-detail-tabs overflow-x-auto">
      <div
        className="patient-detail-tabs-list inline-flex min-w-full gap-1 p-1 sm:min-w-0"
        role="tablist"
        aria-label="Patient profile sections"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'patient-detail-tab-trigger inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:flex-none sm:min-w-[10rem]',
                isActive && 'patient-detail-tab-trigger-active',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{tab.label}</span>
              {tab.id === 'history' && historyCount > 0 ? (
                <span className="rounded-full bg-[hsl(var(--metric-patients)/0.15)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[hsl(var(--metric-patients))]">
                  {historyCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
