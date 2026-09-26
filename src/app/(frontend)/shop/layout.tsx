import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Shop',
  description: 'Browse DPICS robotics kits, accessories, and learning resources.',
  path: '/shop',
  keywords: ['robotics shop', 'DPICS merchandise', 'robotics kits'],
})

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children
}
