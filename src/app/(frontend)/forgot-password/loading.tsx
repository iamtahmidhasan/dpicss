'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function ForgotPasswordLoading() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-muted p-6 animate-pulse">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  )
}
