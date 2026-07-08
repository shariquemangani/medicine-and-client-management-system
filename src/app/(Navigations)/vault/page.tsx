'use client'

import { VaultHero, VaultHub } from '@/components/medicines'
import { BentoGrid, BentoCard } from '@/components/shared'

export default function VaultPage() {
  return (
    <div className="vault-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <VaultHero />
        </BentoCard>
      </BentoGrid>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {'Vault modules'}
        </p>
        <VaultHub />
      </div>
    </div>
  )
}
