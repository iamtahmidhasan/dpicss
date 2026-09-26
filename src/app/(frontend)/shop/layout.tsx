import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Shop',
  description: 'Browse DPICS merchandise, accessories, and learning resources.',
  path: '/shop',
  keywords: ['DPICS shop', 'DPICS merchandise', 'club merch'],
})

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children
}
