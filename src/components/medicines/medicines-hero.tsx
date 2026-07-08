'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { BookOpen, Plus, Download, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MedicinesHeroProps {
  onRefresh: () => void
  onAdd: () => void
  refreshing?: boolean
}

export function MedicinesHero({ onRefresh, onAdd, refreshing }: MedicinesHeroProps) {
  return (
    <div className="classes-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="classes-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="classes-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <BookOpen className="h-3 w-3" />
            {'Medicine vault'}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {'Medicine'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="classes-hero-btn">
            <Link href={ROUTES.vault}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              {'Back to Vault'}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="classes-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {'Refresh'}
          </Button>
          <Button variant="outline" size="sm" className="classes-hero-btn">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {'Export'}
          </Button>
          <Button size="sm" className="classes-hero-primary" onClick={onAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {'Add Medicine'}
          </Button>
        </div>
      </div>
    </div>
  )
}
