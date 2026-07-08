'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { Activity, ArrowLeft } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { Button } from '@/components/ui/button'
export default function DiseasesVaultPage() {
  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--metric-exams)/0.25)] bg-[hsl(var(--metric-exams)/0.1)] px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--metric-exams))]">
                <Activity className="h-3 w-3" />
                {'Catalog'}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {'Diseases'}
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                {'Maintain condition catalogs used across registration and visits.'}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.vault}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                {'Back to Vault'}
              </Link>
            </Button>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-[hsl(var(--glass-border))] bg-muted/30 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">{'This vault module is ready for configuration — content coming soon.'}</p>
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
