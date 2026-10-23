'use client'

import { BookOpen } from 'lucide-react'
import type { Medicine } from '@/types'
import { PageHero } from '@/components/shared/page-hero'
import { ROUTES } from '@/lib/routes'
import { t } from '@/lib/labels'

interface MedicineDetailHeaderProps {
  cls: Medicine
}

export function MedicineDetailHeader({ cls }: MedicineDetailHeaderProps) {
  return (
    <PageHero
      icon={BookOpen}
      badge={t('medicines.vaultBadge')}
      title={cls.name}
      back={{ href: ROUTES.vaultMedicine, label: 'Back to medicines' }}
    />
  )
}
