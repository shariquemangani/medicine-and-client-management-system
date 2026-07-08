import * as React from 'react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export interface RangeProps extends React.ComponentPropsWithoutRef<
  typeof Slider
> {
  minLabel?: React.ReactNode
  maxLabel?: React.ReactNode
  containerClassName?: string
}

export const Range = React.forwardRef<
  React.ElementRef<typeof Slider>,
  RangeProps
>(({ minLabel, maxLabel, containerClassName, className, ...props }, ref) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50',
        containerClassName
      )}
    >
      {minLabel && (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {minLabel}
        </span>
      )}
      <div className={cn('w-24', className)}>
        <Slider ref={ref} {...props} />
      </div>
      {maxLabel && (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {maxLabel}
        </span>
      )}
    </div>
  )
})
Range.displayName = 'Range'
