import { ReactNode, Suspense } from 'react'

interface DataSectionProps {
  children: ReactNode
  fallback: ReactNode
  key?: string
}

/**
 * Production-level Suspense wrapper for streaming data sections
 * Enables progressive content loading with skeleton fallbacks
 */
export function DataSection({ children, fallback, key }: DataSectionProps) {
  return (
    <Suspense key={key} fallback={fallback}>
      {children}
    </Suspense>
  )
}

/**
 * Wrapper for multiple data sections to load in parallel
 */
export function DataSections({ children }: { children: ReactNode }) {
  return <>{children}</>
}
