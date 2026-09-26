'use client'

import { MemberSkeletonGrid } from '@/components/skeletons'

export default function MembersLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl p-6 space-y-8">
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      <MemberSkeletonGrid count={8} />
    </div>
  )
}
