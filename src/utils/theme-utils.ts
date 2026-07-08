/**
 * Utility functions for theme management
 */

/**
 * Detects the system color scheme preference
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Sets up a listener for system theme changes
 * @param callback Function to call when system theme changes
 * @returns Cleanup function to remove the listener
 */
export function listenForSystemThemeChanges(
  callback: (theme: 'dark' | 'light') => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = () => {
    callback(mediaQuery.matches ? 'dark' : 'light')
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * Applies the theme class to the document root element
 * @param theme The theme to apply ('dark', 'light', or 'system')
 * @param storageKey The key used to store the theme preference
 */
export function applyTheme(theme: string, storageKey: string = 'theme'): void {
  if (typeof window === 'undefined' || !document) return
  
  // Get the system theme
  const systemTheme = getSystemTheme()
  
  // Apply the appropriate class based on the theme
  if (theme === 'system') {
    document.documentElement.classList.toggle('dark', systemTheme === 'dark')
    localStorage.setItem(storageKey, 'system')
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(storageKey, theme)
  }
}
