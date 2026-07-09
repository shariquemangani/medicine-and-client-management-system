'use client'

import { AlertTriangle, Boxes, IndianRupee, PackageX, Timer } from 'lucide-react'
import { BentoCard, AnimatedStat } from '@/components/shared'
import type { StockStats } from '@/types/stock'
import { t } from '@/lib/labels'

interface InventoryStatsCardsProps {
  stats: StockStats
}

export function InventoryStatsCards({ stats }: InventoryStatsCardsProps) {
  return (
    <>
      <BentoCard colSpan={3} accent="inventory" delay={60}>
        <AnimatedStat
          title={t('inventory.statSkus')}
          value={stats.totalSkus}
          icon={Boxes}
          accent="inventory"
          compact
        />
      </BentoCard>
      <BentoCard colSpan={3} accent="medicines" delay={120}>
        <AnimatedStat
          title={t('inventory.statValue')}
          value={stats.totalValue}
          icon={IndianRupee}
          accent="medicines"
          currency
          compact
        />
      </BentoCard>
      <BentoCard colSpan={3} accent="fees" delay={180}>
        <AnimatedStat
          title={t('inventory.statLowStock')}
          value={stats.lowCount + stats.criticalCount + stats.outOfStockCount}
          icon={AlertTriangle}
          accent="fees"
          compact
        />
      </BentoCard>
      <BentoCard colSpan={3} accent="prescriptions" delay={240}>
        <AnimatedStat
          title={t('inventory.statExpiring')}
          value={stats.expiringSoonCount}
          icon={Timer}
          accent="prescriptions"
          compact
        />
      </BentoCard>
    </>
  )
}

export function InventoryStatsRow({ stats }: InventoryStatsCardsProps) {
  return (
    <>
      <BentoCard colSpan={2} accent="inventory" delay={280} className="hidden xl:block">
        <AnimatedStat
          title={t('inventory.statOutOfStock')}
          value={stats.outOfStockCount}
          icon={PackageX}
          accent="inventory"
          compact
        />
      </BentoCard>
      <BentoCard colSpan={2} accent="patients" delay={300} className="hidden xl:block">
        <AnimatedStat
          title={t('inventory.statMovements')}
          value={stats.movementCount30d}
          icon={Boxes}
          accent="patients"
          compact
        />
      </BentoCard>
    </>
  )
}
