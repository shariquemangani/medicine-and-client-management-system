'use client'

import { Library } from 'lucide-react'
import { PageHero } from '@/components/shared/page-hero'

export function VaultHero() {
  return (
    <PageHero
      icon={Library}
      badge="Clinical vault"
      title="Vault"
      subtitle="Medicines, disease catalogs and flag rules that power prescriptions and patient care"
    />
  )
}
