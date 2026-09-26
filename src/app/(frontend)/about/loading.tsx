'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function AboutLoading() {
  return (
    <div className="bg-background animate-pulse">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-8">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>

      <div className="space-y-24 pb-24 md:space-y-32 md:pb-32">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
