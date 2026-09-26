import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Members',
  description: 'Meet active DPIRC members and explore their public profiles and accomplishments.',
  path: '/members',
  keywords: ['DPIRC members', 'robotics community', 'student profiles'],
})

export default function MembersLayout({ children }: { children: ReactNode }) {
  return children
}
