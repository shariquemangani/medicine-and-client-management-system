'use client'

import { ClipboardCheck, Clock, UserCheck, UserX } from 'lucide-react'
import { BentoCard, AnimatedStat } from '@/components/shared'

interface InventoryStatsCardsProps {
  stats: { total: number; present: number; absent: number; late: number }
}

export function InventoryStatsCards({ stats }: InventoryStatsCardsProps) {

  return (
    <>
      <BentoCard colSpan={3} accent="inventory" delay={60}>
        <AnimatedStat
          title={'Class roster'}
          value={stats.total}
          icon={ClipboardCheck}
          accent="inventory"
          compact
        />
      </BentoCard>
      <BentoCard colSpan={3} accent="medicines" delay={120}>
        <AnimatedStat
          title={'Present'}
          value={stats.present}
          icon={UserCheck}
          accent="medicines"
          compact
        />
      </BentoCard>
      <BentoCard colSpan={3} accent="fees" delay={180}>
        <AnimatedStat
          title={'Absent'}
          value={stats.absent}
          icon={UserX}
          accent="fees"
          compact
        />
      </BentoCard>
      <BentoCard colSpan={3} accent="prescriptions" delay={240}>
        <AnimatedStat
          title={'Late'}
          value={stats.late}
          icon={Clock}
          accent="prescriptions"
          compact
        />
      </BentoCard>
    </>
  )
}
