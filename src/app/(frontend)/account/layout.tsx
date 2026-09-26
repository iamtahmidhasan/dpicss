import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'My Account',
  description: 'Manage your DPICS profile, enrollments, and announcements.',
  path: '/account',
  noIndex: true,
})

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children
}
