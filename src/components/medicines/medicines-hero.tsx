'use client'

import { BookOpen, Plus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/labels'

interface MedicinesHeroProps {
  total?: number
  active?: number
  onRefresh: () => void
  onAdd: () => void
  refreshing?: boolean
}

export function MedicinesHero({ total, active, onRefresh, onAdd, refreshing }: MedicinesHeroProps) {
  return (
    <div className="classes-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="classes-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="classes-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <BookOpen className="h-3 w-3" />
            {t('medicines.vaultBadge')}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t('medicines.heroTitle')}
          </h2>
          {typeof total === 'number' ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('medicines.listHeroSubtitle', {
                total,
                active: active ?? total,
              })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="classes-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" className="classes-hero-btn">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')}
          </Button>
          <Button size="sm" className="classes-hero-primary" onClick={onAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('medicines.addMedicine')}
          </Button>
        </div>
      </div>
    </div>
  )
}
