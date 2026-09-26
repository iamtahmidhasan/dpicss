import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@/payload.config'
import { createPageMetadata } from '@/lib/seo'

type Props = {
  children: ReactNode
  params: Promise<{ username: string }> | { username: string }
}

type ProfileSeoDoc = {
  firstName?: string
  lastName?: string
  username?: string
  memberId?: string
  bio?: string
  isActive?: boolean
  directoryApprovalStatus?: 'approved' | 'pending' | 'rejected' | null
}

function toTwitterHandle(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace(/^@+/, '')
  if (!normalized) return undefined
  return `@${normalized}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await Promise.resolve(params)
  const slug = resolved.username
  const payload = await getPayloadWithRetry()

  const found = await payload.find({
    collection: 'members',
    where: {
      and: [
        {
          or: [
            { username: { equals: slug.toLowerCase() } },
            { memberId: { equals: slug.toUpperCase() } },
          ],
        },
        { isActive: { equals: true } },
        {
          or: [
            { directoryApprovalStatus: { equals: 'approved' } },
            { directoryApprovalStatus: { exists: false } },
          ],
        },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (!found.docs.length) {
    return createPageMetadata({
      title: 'Profile Not Found',
      description: 'The requested member profile could not be found.',
      path: `/profile/${slug}`,
      noIndex: true,
    })
  }

  const doc = found.docs[0] as ProfileSeoDoc
  const displayName = [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim() || 'Member'
  const title = `${displayName} (@${doc.username || slug})`
  const description =
    doc.bio?.trim() || `${displayName}'s public profile on DPI Robotics Club (DPIRC).`
  const twitterCreator = toTwitterHandle(doc.username || doc.memberId || slug)

  return createPageMetadata({
    title,
    description,
    path: `/profile/${slug}`,
    twitterCreator,
  })
}

export default function PublicProfileLayout({ children }: { children: ReactNode }) {
  return children
}
