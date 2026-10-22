'use client'

import { Flag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'

interface FlagConfigHeroProps {
  onAddCategory: () => void
}

export function FlagConfigHero({ onAddCategory }: FlagConfigHeroProps) {
  return (
    <PageHero
      icon={Flag}
      badge="Signals"
      title="Flag Configuration"
      subtitle="Manage flags and categories for filtering"
      actions={
        <Button size="sm" className={heroPrimaryClass} onClick={onAddCategory}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {'Add Category'}
        </Button>
      }
    />
  )
}
