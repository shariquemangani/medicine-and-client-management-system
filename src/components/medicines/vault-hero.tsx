'use client'

import { Library } from 'lucide-react'
export function VaultHero() {
  return (
    <div className="vault-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="vault-hero-mesh pointer-events-none" aria-hidden />
      <div className="vault-hero-scanline pointer-events-none" aria-hidden />
      <div className="relative z-10">
        <div className="vault-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
          <Library className="h-3 w-3" />
          {'Clinical vault'}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {'Vault'}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {'Configure medicines, disease catalogs, and flag rules that power prescriptions and patient care.'}
        </p>
      </div>
    </div>
  )
}
