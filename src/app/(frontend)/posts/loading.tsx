'use client'

import { PostSkeletonGrid } from '@/components/skeletons'

export default function PostsLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
      <PostSkeletonGrid count={6} />
    </main>
  )
}
