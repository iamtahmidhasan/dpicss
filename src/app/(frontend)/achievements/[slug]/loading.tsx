'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function AchievementDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-8 animate-pulse">
      <Skeleton className="h-5 w-24" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />

          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>

          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />

          <Skeleton className="h-px w-full" />

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="size-4 rounded shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
