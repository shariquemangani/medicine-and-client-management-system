import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeroProps {
  /** Small icon shown in the tile at the left. */
  icon: LucideIcon
  /** Short label shown as a pill next to the title, e.g. "Patient registry". */
  badge?: string
  /** The page's one and only h1. */
  title: React.ReactNode
  /** Second line. Pass a skeleton node while API data (counts) is loading. */
  subtitle?: React.ReactNode
  /** Buttons on the right (use `heroButtonClass` / `heroPrimaryClass`). */
  actions?: React.ReactNode
  /** Inner pages: a round back button before the icon tile. */
  back?: { href: string; label: string }
  className?: string
}

/** Secondary (outline) and primary button classes that match the hero surface. */
export const heroButtonClass = 'page-hero-btn h-8 rounded-xl px-3 text-xs'
export const heroPrimaryClass = 'page-hero-primary h-8 rounded-xl px-3 text-xs'

/**
 * The one page header used on every page: gradient surface with grid texture (the Flag
 * Configuration look), laid out on two lines:
 *   line 1: icon tile, title + badge pill        |  actions
 *   line 2: muted subtitle
 */
export function PageHero({ icon: Icon, badge, title, subtitle, actions, back, className }: PageHeroProps) {
  return (
    <div className={cn('page-hero relative overflow-hidden rounded-2xl px-4 py-3 sm:px-5', className)}>
      <div className="page-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 basis-full items-center gap-3 lg:flex-1 lg:basis-0">
          {back ? (
            <Link
              href={back.href}
              aria-label={back.label}
              className="page-hero-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            >
              <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          ) : null}
          <span className="page-hero-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" aria-hidden>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 sm:flex-nowrap">
              <h1 className="min-w-0 truncate text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
              {badge ? (
                <span className="page-hero-badge inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium">
                  {badge}
                </span>
              ) : null}
            </div>
            {subtitle ? (
              <div className={cn('mt-0.5 min-h-[1.25rem] text-sm leading-5 text-muted-foreground', actions ? 'max-w-md' : 'max-w-3xl')}>{subtitle}</div>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">{actions}</div> : null}
      </div>
    </div>
  )
}
