import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Forgot Password',
  description: 'Request a secure password reset for your DPICS account.',
  path: '/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children
}
