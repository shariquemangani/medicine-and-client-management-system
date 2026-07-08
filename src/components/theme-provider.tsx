'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from 'next-themes'
import { getSystemTheme, listenForSystemThemeChanges } from '@/utils'

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  // Force update on theme change to ensure Tailwind classes update correctly
  const [mounted, setMounted] = React.useState(false)
  
  // Initialize theme on patient-side
  React.useEffect(() => {
    // Get stored theme or use default
    const savedTheme = localStorage.getItem(storageKey) || defaultTheme
    
    // Apply the theme immediately to prevent flash
    if (savedTheme === 'system') {
      // For system theme, check system preference
      const systemTheme = getSystemTheme()
      document.documentElement.classList.toggle('dark', systemTheme === 'dark')
    } else {
      // For explicit theme choice
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
    
    // Set up listener for system theme changes
    const cleanup = listenForSystemThemeChanges((newSystemTheme) => {
      // Only update if using system theme
      const currentTheme = localStorage.getItem(storageKey)
      if (currentTheme === 'system' || !currentTheme) {
        document.documentElement.classList.toggle('dark', newSystemTheme === 'dark')
      }
    })
    
    // Set mounted state to true
    setMounted(true)
    
    return cleanup
  }, [defaultTheme, storageKey])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
      {...props}
    >
      {/* Only render children once mounted to avoid hydration mismatch */}
      {mounted ? children : <ThemeInitializer>{children}</ThemeInitializer>}
    </NextThemesProvider>
  )
}

// Component to prevent flash of unstyled content during hydration
function ThemeInitializer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ visibility: 'hidden' }}>
      {children}
    </div>
  )
}

export const useTheme = useNextTheme
