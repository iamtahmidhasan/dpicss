'use client'

import { CourseSkeletonGrid } from '@/components/skeletons'

export default function CoursesLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-muted rounded" />
        <div className="h-10 w-24 bg-muted rounded" />
      </div>
      <CourseSkeletonGrid count={6} />
    </div>
  )
}
