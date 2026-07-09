'use client'

import Link from 'next/link'
import { forwardRef } from 'react'
import { Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SidebarNavAccent =
  | '--metric-patients'
  | '--metric-teachers'
  | '--metric-classes'
  | '--metric-attendance'
  | '--metric-exams'
  | '--metric-fees'
  | '--primary'

interface AdminSidebarNavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  accent: SidebarNavAccent
  isActive: boolean
  collapsed?: boolean
  onClick?: () => void
  variant?: 'primary' | 'child'
}

export function AdminSidebarNavLink({
  href,
  label,
  icon: Icon,
  accent,
  isActive,
  collapsed = false,
  onClick,
  variant = 'primary',
}: AdminSidebarNavLinkProps) {
  const isChild = variant === 'child'

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed && !isChild ? label : undefined}
      className={cn(
        'admin-sidebar-nav-item group flex items-center font-medium',
        isChild
          ? 'admin-sidebar-nav-child gap-2 rounded-lg px-2 py-1.5 text-[13px]'
          : 'gap-2.5 rounded-xl px-2.5 py-2 text-sm',
        !isChild && collapsed && 'justify-center px-2',
        isActive && 'admin-sidebar-nav-item-active'
      )}
      style={{ '--nav-accent': `var(${accent})` } as React.CSSProperties}
      data-active={isActive}
    >
      <span
        className={cn(
          'admin-sidebar-nav-icon flex shrink-0 items-center justify-center',
          isChild ? 'h-7 w-7 rounded-md' : 'h-8 w-8 rounded-lg'
        )}
      >
        <Icon className={isChild ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'} />
      </span>
      {(!collapsed || isChild) && (
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
          <span className="truncate">{label}</span>
          {!isChild && (
            <Sparkles className="h-3 w-3 shrink-0 text-primary opacity-70" aria-hidden />
          )}
        </span>
      )}
    </Link>
  )
}

interface AdminSidebarNavTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: LucideIcon
  accent: SidebarNavAccent
  isActive: boolean
  collapsed?: boolean
  open?: boolean
  showChevron?: boolean
}

export const AdminSidebarNavTrigger = forwardRef<HTMLButtonElement, AdminSidebarNavTriggerProps>(
  function AdminSidebarNavTrigger(
    {
      label,
      icon: Icon,
      accent,
      isActive,
      collapsed = false,
      open = false,
      showChevron = false,
      className,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        title={collapsed ? label : undefined}
        className={cn(
          'admin-sidebar-nav-item group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium',
          collapsed && 'justify-center px-2',
          isActive && 'admin-sidebar-nav-item-active',
          className
        )}
        style={{ '--nav-accent': `var(${accent})` } as React.CSSProperties}
        data-active={isActive}
        aria-label={props['aria-label'] ?? label}
        {...props}
      >
        <span className="admin-sidebar-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left">
              <span className="truncate">{label}</span>
              <Sparkles className="h-3 w-3 shrink-0 text-primary opacity-70" aria-hidden />
            </span>
            {showChevron && <ChevronIcon open={open} />}
          </>
        )}
      </button>
    )
  }
)

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
        open && 'rotate-180'
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
