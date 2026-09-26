'use client'

import { PostDetailSkeleton } from '@/components/skeletons'

export default function PostDetailsLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <PostDetailSkeleton />
    </div>
  )
}
