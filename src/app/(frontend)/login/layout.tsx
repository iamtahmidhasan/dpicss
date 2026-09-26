import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Login',
  description: 'Sign in to your DPICS account to access courses and member features.',
  path: '/login',
  noIndex: true,
})

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
