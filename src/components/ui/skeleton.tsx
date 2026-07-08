import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md bg-gray-200 animate-breathing', className)}
      {...props}
    />
  )
}

export { Skeleton }
