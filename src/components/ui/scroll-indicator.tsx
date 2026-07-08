import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollIndicatorProps {
  totalSteps: number
  currentIndex: number
  isAtStart: boolean
  isAtEnd: boolean
  onPrev: () => void
  onNext: () => void
  onStepClick: (index: number) => void
  className?: string
}

export function ScrollIndicator({
  totalSteps,
  currentIndex,
  isAtStart,
  isAtEnd,
  onPrev,
  onNext,
  onStepClick,
  className,
}: ScrollIndicatorProps) {
  return (
    <div className={cn("flex justify-center items-center gap-4", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        className={cn(
          "w-8 h-8 rounded-full bg-slate-50 text-gray-500 hover:text-gray-700 transition-opacity",
          isAtStart ? "opacity-30 cursor-not-allowed" : "opacity-100"
        )}
        disabled={isAtStart}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isActive = currentIndex === i
          return (
            <button
              key={i}
              onClick={() => onStepClick(i)}
              className={cn(
                "transition-all duration-300 rounded-full cursor-pointer hover:opacity-80 border-none p-0 outline-none",
                isActive ? "w-8 h-2 bg-gray-400" : "w-1.5 h-1.5 bg-gray-200"
              )}
              aria-label={`Scroll to section ${i + 1}`}
            />
          )
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        className={cn(
          "w-8 h-8 rounded-full bg-slate-50 text-gray-500 hover:text-gray-700 transition-opacity",
          isAtEnd ? "opacity-30 cursor-not-allowed" : "opacity-100"
        )}
        disabled={isAtEnd}
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
