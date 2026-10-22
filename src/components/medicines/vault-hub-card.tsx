'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VaultHubAccent = 'medicine' | 'diseases' | 'flags'

interface VaultHubCardProps {
  href: string
  title: string
  description: string
  icon: LucideIcon
  accent: VaultHubAccent
  delay?: number
  badge?: string
}

const accentClass: Record<VaultHubAccent, string> = {
  medicine: 'vault-hub-card--medicine',
  diseases: 'vault-hub-card--diseases',
  flags: 'vault-hub-card--flags',
}

export function VaultHubCard({
  href,
  title,
  description,
  icon: Icon,
  accent,
  delay = 0,
  badge,
}: VaultHubCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'vault-hub-card group relative block overflow-hidden rounded-2xl outline-none',
        'focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        accentClass[accent]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="vault-hub-card-grid" aria-hidden />
      <div className="vault-hub-card-orb vault-hub-card-orb--primary" aria-hidden />
      <div className="vault-hub-card-orb vault-hub-card-orb--secondary" aria-hidden />
      <div className="vault-hub-card-scan" aria-hidden />

      <div className="relative z-10 flex h-full min-h-[220px] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="vault-hub-card-icon flex h-12 w-12 items-center justify-center rounded-xl">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className="vault-hub-card-arrow flex h-9 w-9 items-center justify-center rounded-full">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300" />
          </span>
        </div>

        <div className="mt-auto space-y-2 pt-8">
          {badge ? (
            <span className="vault-hub-card-badge inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
              {badge}
            </span>
          ) : null}
          <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h3>
          <p className="max-w-[28ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="vault-hub-card-edge" aria-hidden />
      </div>
    </Link>
  )
}
