'use client'

import { CourseDetailSkeleton } from '@/components/skeletons'

export default function CourseDetailsLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <CourseDetailSkeleton />
    </div>
  )
}
