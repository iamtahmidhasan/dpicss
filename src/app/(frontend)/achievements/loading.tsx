'use client'

import { CardSkeletonGrid } from '@/components/skeletons'

export default function AchievementsLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      <CardSkeletonGrid count={6} />
    </div>
  )
}
