import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseNavigationPreventionOptions {
  hasChanges: boolean
  isEditMode: boolean
  onShowModal: () => void
  onSetPendingNavigation: (navigationFn: (() => void) | null) => void
}

export function useNavigationPrevention({
  hasChanges,
  isEditMode,
  onShowModal,
  onSetPendingNavigation,
}: UseNavigationPreventionOptions) {
  const router = useRouter()

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (hasChanges && isEditMode) {
      e.preventDefault()
      e.returnValue = '' // Chrome requires returnValue to be set
      return '' // Some browsers show this message
    }
  }, [hasChanges, isEditMode])

  const handlePopState = useCallback((e: PopStateEvent) => {
    if (hasChanges && isEditMode) {
      e.preventDefault()
      onSetPendingNavigation(() => () => window.history.back())
      onShowModal()
    }
  }, [hasChanges, isEditMode, onSetPendingNavigation, onShowModal])

  const handleLinkClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement

    if (link && hasChanges && isEditMode) {
      e.preventDefault()
      e.stopPropagation()
      const href = link.getAttribute('href')
      if (href) {
        onSetPendingNavigation(() => () => {
          // Use Next.js router for internal navigation, window.location for external
          if (href.startsWith('/')) {
            router.push(href)
          } else {
            window.location.href = href
          }
        })
        onShowModal()
      }
    }
  }, [hasChanges, isEditMode, router, onSetPendingNavigation, onShowModal])

  useEffect(() => {
    if (hasChanges && isEditMode) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('popstate', handlePopState)
      document.addEventListener('click', handleLinkClick, true) // Use capture phase
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [hasChanges, isEditMode, handleBeforeUnload, handlePopState, handleLinkClick])
}
