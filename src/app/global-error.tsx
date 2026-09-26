'use client'

import { Button } from '@/components/ui/button'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-xl border bg-background p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold">Application error</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A server error occurred while loading this page.
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
      </body>
    </html>
  )
}
