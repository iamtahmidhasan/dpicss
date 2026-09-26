import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Courses',
  description:
    'Explore production-ready robotics, electronics, and programming courses from DPIRC.',
  path: '/courses',
  keywords: ['robotics courses', 'programming courses', 'DPIRC'],
})

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return children
}
