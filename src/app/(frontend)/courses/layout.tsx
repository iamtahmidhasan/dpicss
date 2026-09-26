import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Courses',
  description:
    'Explore production-ready software, web development, and programming courses from DPICS.',
  path: '/courses',
  keywords: ['computing courses', 'programming courses', 'DPICS'],
})

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return children
}
