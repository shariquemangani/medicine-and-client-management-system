import React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface VaultCardProps {
  title: string
  icon: React.ReactNode
  onClick?: () => void
  className?: string
}

export function VaultCard({ title, icon, onClick, className }: VaultCardProps) {
  return (
    <Card
      className={cn(
        'group flex flex-col items-center justify-center p-6 cursor-pointer hover:shadow-md transition-all aspect-square rounded-xl border border-gray-100 bg-white shadow-sm',
        className
      )}
      onClick={onClick}
    >
      <div className="bg-[#f2f4f8] p-3 rounded-xl mb-4 flex items-center justify-center text-[#5c677d]">
        {icon}
      </div>
      <h3 className="font-medium text-[14px] text-[#10203C] text-center">
        {title}
      </h3>
    </Card>
  )
}
