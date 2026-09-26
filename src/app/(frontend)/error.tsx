'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

type FrontendErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function FrontendError({ error, reset }: FrontendErrorProps) {
  const hasRetried = useRef(false)

  useEffect(() => {
    // Auto-retry once for transient serverless cold-start/network hiccups.
    if (hasRetried.current) return
    hasRetried.current = true

    const timer = window.setTimeout(() => {
      reset()
    }, 400)

    return () => window.clearTimeout(timer)
  }, [reset])

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-xl border bg-background p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Temporary server issue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page failed to render. We already retried once automatically.
        </p>
        {error?.digest ? (
          <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </main>
  )
}
