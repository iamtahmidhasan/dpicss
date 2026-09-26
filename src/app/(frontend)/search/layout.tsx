import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Search',
  description: 'Search courses, posts, and members on DPICS.',
  path: '/search',
  noIndex: true,
})

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children
}
