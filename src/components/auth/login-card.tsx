'use client'

import { Stethoscope, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { mainCardShadow } from '@/utils/theme'
import { cn } from '@/lib/utils'

interface LoginCardProps {
  children: ReactNode
}

export function LoginCard({ children }: LoginCardProps) {

  return (
    <div className="login-card-wrap w-full max-w-[400px]">
      <div className="login-card-shell">
        <div className={cn('login-card-inner', mainCardShadow)}>
          <div className="login-card-accent" aria-hidden />
          <div className="login-card-ambient login-card-ambient-1" aria-hidden />
          <div className="login-card-ambient login-card-ambient-2" aria-hidden />

          <div className="relative z-10 px-7 py-8 sm:px-8 sm:py-9">
            <header className="mb-7 flex items-start gap-4">
              <div className="login-card-icon-wrap shrink-0">
                <div className="login-card-icon-ring" aria-hidden />
                <div className="login-card-icon-core">
                  <Stethoscope className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>
              <div className="min-w-0 pt-0.5">
                <h2 className="text-[1.35rem] font-semibold leading-tight tracking-tight text-foreground">
                  {'Welcome back'}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {'Sign in to your admin workspace'}
                </p>
                <div className="login-card-secure-badge mt-3">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {'Secure Admin Access'}
                </div>
              </div>
            </header>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
