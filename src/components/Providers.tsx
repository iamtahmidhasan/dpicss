'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@/lib/theme-provider'
import type { AppLocale } from '@/lib/locale'
import { LOCALE_COOKIE } from '@/lib/locale'

/**
 * Client-side locale context for immediate UI updates
 */
const LocaleContext = createContext<{
  locale: AppLocale
  setLocale: (locale: AppLocale) => Promise<void>
} | null>(null)

export const LocaleProvider: React.FC<{
  children: ReactNode
  initialLocale: AppLocale
}> = ({ children, initialLocale }) => {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale)
  const router = useRouter()

  const setLocale = async (newLocale: AppLocale) => {
    try {
      // Update local state immediately for instant UI feedback
      setLocaleState(newLocale)

      // Set cookie for server-side consistency
      document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=lax`

      // Trigger server-side re-render
      router.refresh()
    } catch (error) {
      console.error('Failed to switch locale:', error)
    }
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    // Defensive fallback: component rendered outside a LocaleProvider.
    // Avoids crashing (e.g. during partial hydration / edge boundaries).
    // Defaults to enabled English locale; setLocale is a no-op here.
    return {
      locale: 'en' as AppLocale,
      setLocale: async (_locale: AppLocale) => {
        console.warn('useLocale: LocaleProvider not found; ignoring locale change')
      },
    }
  }
  return context
}

/**
 * Client-side providers wrapper.
 * Handles all context providers that require 'use client' directive.
 * Production-ready: Separates provider logic from server layout.
 */
export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: AppLocale
}) {
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
    </ThemeProvider>
  )
}
