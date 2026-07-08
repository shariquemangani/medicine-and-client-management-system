'use client'

import { Users, GraduationCap, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

export type MedicineDetailTab = 'roster' | 'staff' | 'timetable'

const tabs: {
  id: MedicineDetailTab
  labelKey: string
  icon: typeof Users
}[] = [
  { id: 'roster', labelKey: 'medicines.tabs.roster', icon: Users },
  { id: 'staff', labelKey: 'medicines.tabs.teachers', icon: GraduationCap },
  { id: 'timetable', labelKey: 'medicines.tabs.timetable', icon: Calendar },
]

interface MedicineDetailTabsProps {
  activeTab: MedicineDetailTab
  onTabChange: (tab: MedicineDetailTab) => void
}

export function MedicineDetailTabs({ activeTab, onTabChange }: MedicineDetailTabsProps) {

  return (
    <div className="medicine-detail-tabs overflow-x-auto">
      <div className="medicine-detail-tabs-list inline-flex min-w-full gap-1 p-1 sm:min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'medicine-detail-tab-trigger inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive && 'medicine-detail-tab-trigger-active'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
