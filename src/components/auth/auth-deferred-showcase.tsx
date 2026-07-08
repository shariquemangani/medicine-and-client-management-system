'use client'

import dynamic from 'next/dynamic'
import { useDeferredMount } from '@/hooks/use-deferred-mount'
import { useMediaQuery } from '@/hooks/use-media-query'

const Login3DScene = dynamic(
  () =>
    import('./login-3d-scene').then((mod) => ({
      default: mod.Login3DScene,
    })),
  { ssr: false }
)

export function AuthDeferredShowcase() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const ready = useDeferredMount({ idle: true, enabled: isDesktop })

  if (!isDesktop) return null
  if (!ready) {
    return <div className="login-saas-3d-placeholder hidden min-h-[480px] lg:block" aria-hidden />
  }

  return (
    <div className="login-panel-arrive-left w-full">
      <Login3DScene />
    </div>
  )
}
