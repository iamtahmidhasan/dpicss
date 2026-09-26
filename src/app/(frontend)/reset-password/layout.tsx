import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Reset Password',
  description: 'Set a new secure password for your DPIRC account.',
  path: '/reset-password',
  noIndex: true,
})

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children
}
