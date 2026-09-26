import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Shop',
  description: 'Browse DPIRC robotics kits, accessories, and learning resources.',
  path: '/shop',
  keywords: ['robotics shop', 'DPIRC merchandise', 'robotics kits'],
})

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children
}
