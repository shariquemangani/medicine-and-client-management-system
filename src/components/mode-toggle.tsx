'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { useThemeEffect } from '@/hooks/use-theme-effect'

interface ModeToggleProps {
  className?: string
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { setTheme } = useTheme()
  const { mounted, isDark } = useThemeEffect()

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <span className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }
  
  // Toggle directly between light and dark mode
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <Button 
      variant="outline" 
      className={`relative h-9 w-9 rounded-full p-0 overflow-hidden hover:shadow-md transition-all ${className ?? ''}`}
      size="icon"
      onClick={toggleTheme}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
      <span className="sr-only">{'Toggle theme'}</span>
    </Button>
  )
}
