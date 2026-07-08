'use client'

import { useEffect, useState } from 'react'

interface UseDeferredMountOptions {
  delay?: number
  idle?: boolean
  enabled?: boolean
}

/** Defers mounting heavy UI until after first paint / idle time. */
export function useDeferredMount({
  delay = 0,
  idle = true,
  enabled = true,
}: UseDeferredMountOptions = {}): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setMounted(false)
      return
    }

    const mount = () => setMounted(true)

    if (idle && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(mount, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }

    const timer = window.setTimeout(mount, delay)
    return () => window.clearTimeout(timer)
  }, [delay, idle, enabled])

  return mounted
}
