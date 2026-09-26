import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Members',
  description: 'Meet active DPICS members and explore their public profiles and accomplishments.',
  path: '/members',
  keywords: ['DPICS members', 'computing community', 'student profiles'],
})

export default function MembersLayout({ children }: { children: ReactNode }) {
  return children
}
