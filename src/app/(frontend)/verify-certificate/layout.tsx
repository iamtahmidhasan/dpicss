import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Verify Certificate',
  description: 'Validate DPIRC certificate authenticity using the certificate serial number.',
  path: '/verify-certificate',
  keywords: ['certificate verification', 'DPIRC certificate', 'authenticity check'],
})

export default function VerifyCertificateLayout({ children }: { children: ReactNode }) {
  return children
}
