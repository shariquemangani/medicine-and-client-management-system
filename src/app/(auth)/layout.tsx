'use client'

import { useAppSelector } from '@/redux'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, isLoggingOut, sessionVerified } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Only bounce authenticated users away from login once auth is fully ready
    if (!isLoading && !isLoggingOut && isAuthenticated && sessionVerified) {
      router.replace(ROUTES.dashboard)
    }
  }, [isAuthenticated, isLoading, isLoggingOut, sessionVerified, router])

  // Always render login UI so permission/logout never blanks the page
  return <main className="min-h-screen">{children}</main>
}
