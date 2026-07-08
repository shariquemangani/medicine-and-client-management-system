'use client'

import React, { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { cn } from '@/lib/utils'
import { modalOverlayClass } from '@/utils/theme'

export function OfflineOverlay() {
  const isOnline = useOnlineStatus()
  const [isVisible, setIsVisible] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Sync isVisible with !isOnline
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOnline])

  const handleRetry = () => {
    setIsRetrying(true)

    // Simulate a check
    setTimeout(() => {
      if (window.navigator.onLine) {
        setIsVisible(false)
      }
      setIsRetrying(false)
    }, 1000)
  }

  if (!isVisible && isOnline) return null

  return (
    <div
      className={cn(
        modalOverlayClass,
        'fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 animate-in fade-in',
        !isOnline ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="mx-4 max-w-md w-full rounded-2xl border bg-card p-8 shadow-2xl text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
          <WifiOff size={40} strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            No Internet Connection
          </h2>
          <p className="text-muted-foreground">
            It looks like you're offline. Please check your internet connection
            to continue using the application.
          </p>
        </div>

        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="min-w-[140px] gap-2 rounded-xl h-11"
          variant="default"
        >
          {isRetrying ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRetrying ? 'Checking...' : 'Retry'}
        </Button>

        <p className="text-xs text-muted-foreground pt-2">
          Auto-reconnects when connection is restored
        </p>
      </div>
    </div>
  )
}
