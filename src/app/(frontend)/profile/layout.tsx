import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Profile',
  description: 'DPICS member profile and activity overview.',
  path: '/profile',
  noIndex: true,
})

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children
}
