'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { ArrowLeft, Flag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
interface FlagConfigHeroProps {
  onAddCategory: () => void
}

export function FlagConfigHero({ onAddCategory }: FlagConfigHeroProps) {
  return (
    <div className="flag-config-hero relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="flag-config-hero-mesh pointer-events-none" aria-hidden />
      <div className="flag-config-hero-scan pointer-events-none" aria-hidden />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="flag-config-back shrink-0"
            aria-label={'Back to Vault'}
          >
            <Link href={ROUTES.vault}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flag-config-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
              <Flag className="h-3 w-3" />
              {'Signals'}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {'Flag Configuration'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {'Manage flags and categories for filtering'}
            </p>
          </div>
        </div>

        <Button size="sm" className="flag-config-primary shrink-0" onClick={onAddCategory}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {'Add Category'}
        </Button>
      </div>
    </div>
  )
}
