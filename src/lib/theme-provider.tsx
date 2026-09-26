'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const THEME_STORAGE_KEY = 'dpirc-theme'

/**
 * Get the resolved theme based on user preference and system settings.
 * Production-ready: Handles SSR safety and system preference fallback.
 */
function getResolvedTheme(theme: Theme, systemTheme?: 'light' | 'dark'): 'light' | 'dark' {
  if (theme === 'system') {
    return systemTheme || 'light'
  }
  return theme as 'light' | 'dark'
}

/**
 * ThemeProvider component with SSR-safe implementation.
 * - Prevents hydration mismatch by deferring theme application to useEffect
 * - Persists theme preference to localStorage
 * - Supports system preference as fallback
 * - Smooth transitions via CSS class toggle
 * - Always provides context even during hydration
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount (prevents hydration mismatch)
  useEffect(() => {
    // Get stored preference or default to 'system'
    const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system'
    setThemeState(storedTheme)

    // Detect system theme preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const detectedSystemTheme = darkModeQuery.matches ? 'dark' : 'light'
    setSystemTheme(detectedSystemTheme)

    // Apply initial theme
    applyTheme(storedTheme, detectedSystemTheme)

    // Listen for system theme changes
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)

      // If user is on 'system' mode, apply new system theme
      if (storedTheme === 'system') {
        applyTheme('system', newSystemTheme)
      }
    }

    darkModeQuery.addEventListener('change', handleSystemThemeChange)
    setMounted(true)

    return () => {
      darkModeQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme, systemTheme)
  }

  const resolvedTheme = getResolvedTheme(theme, systemTheme)

  // Always provide context, even during hydration
  // This prevents "useTheme must be used within ThemeProvider" errors
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to use theme context anywhere in the app.
 * Must be used in client components wrapped by ThemeProvider.
 * Safe during hydration with default fallback.
 */
export function useTheme() {
  const context = useContext(ThemeContext)

  // Provide safe defaults during hydration if context is unavailable
  if (context === undefined) {
    // Return default theme state to prevent crashes
    // Theme will properly initialize on first useEffect
    return {
      theme: 'system' as Theme,
      resolvedTheme: 'light' as const,
      setTheme: () => {},
    }
  }

  return context
}

/**
 * Apply theme to document.
 * Updates the 'dark' class on <html> element for Tailwind dark mode.
 */
function applyTheme(theme: Theme, systemTheme: 'light' | 'dark') {
  const resolvedTheme = getResolvedTheme(theme, systemTheme)
  const htmlElement = document.documentElement

  if (resolvedTheme === 'dark') {
    htmlElement.classList.add('dark')
  } else {
    htmlElement.classList.remove('dark')
  }
}
