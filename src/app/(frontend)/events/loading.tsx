'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function EventsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="relative pl-16">
            <div className="absolute left-0 top-1/2 -translate-x-1/2 size-4 rounded-full bg-muted-foreground/20" />
            <div className="rounded-lg border overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex flex-col items-center justify-center bg-muted/50 p-4 md:w-24 space-y-1">
                  <Skeleton className="h-8 w-10" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
