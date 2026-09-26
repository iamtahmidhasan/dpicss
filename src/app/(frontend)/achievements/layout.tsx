import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Achievements',
  description: 'Discover competition wins, project milestones, and success stories from DPICS.',
  path: '/achievements',
  keywords: ['computing achievements', 'DPICS awards', 'competition wins'],
})

export default function AchievementsLayout({ children }: { children: ReactNode }) {
  return children
}
