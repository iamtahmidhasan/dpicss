'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CourseSortButtons() {
  const searchParams = useSearchParams()
  const popular = searchParams.get('sort') === 'popular'

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant={!popular ? 'default' : 'outline'} size="sm">
        <Link href="/courses?sort=latest">Latest</Link>
      </Button>
      <Button asChild variant={popular ? 'default' : 'outline'} size="sm">
        <Link href="/courses?sort=popular">Most Popular</Link>
      </Button>
    </div>
  )
}