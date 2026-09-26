import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Blog Posts',
  description: 'Read robotics tutorials, announcements, and engineering insights from DPICS.',
  path: '/posts',
  keywords: ['robotics blog', 'DPICS posts', 'engineering tutorials'],
})

export default function PostsLayout({ children }: { children: ReactNode }) {
  return children
}
