import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva('btn-premium [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'btn-premium-default',
      secondary: 'btn-premium-secondary',
      disabled: 'btn-premium-disabled',
      outline: 'btn-premium-outline',
      warning: 'btn-premium-warning',
      destructive: 'btn-premium-destructive',
      ghost: 'btn-premium-ghost',
      link: 'btn-premium-link h-auto px-0 py-0',
      gradient: 'btn-premium-gradient',
      'gradient-outline': 'btn-premium-gradient-outline',
      'gradient-ghost': 'btn-premium-gradient-ghost',
    },
    size: {
      default: 'h-9 px-3.5 py-2',
      sm: 'h-8 px-3 text-[13px]',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-9 w-9 p-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        style={{ opacity: loading ? 0.7 : undefined }}
        {...props}
      >
        
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
