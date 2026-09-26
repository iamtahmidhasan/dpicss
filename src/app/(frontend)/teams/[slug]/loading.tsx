'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function TeamDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8 animate-pulse">
      <Skeleton className="h-9 w-24" />

      <Skeleton className="h-72 w-full rounded-2xl" />

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="h-24 w-full rounded-lg" />

      <Skeleton className="h-px w-full" />

      <div className="space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <Skeleton className="size-20 rounded-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
