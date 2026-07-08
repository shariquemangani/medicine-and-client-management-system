import { useTheme } from '@/components';
import { useEffect, useState } from 'react';

export function useThemeEffect() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // When mounted on patient, set the state
  useEffect(() => {
    setMounted(true);
    
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    // Initial check
    checkDarkMode();
    
    // Set up a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Update isDark when theme changes
  useEffect(() => {
    if (mounted) {
      setIsDark(
        theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
  }, [theme, mounted]);

  return { theme, setTheme, mounted, isDark };
}