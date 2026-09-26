import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { toAbsoluteUrl } from '@/lib/seo'

type SlugDoc = {
  slug?: string | null
  updatedAt?: string | Date | null
}

type MemberDoc = {
  username?: string | null
  memberId?: string | null
  updatedAt?: string | Date | null
}

function toDate(input: string | Date | null | undefined): Date {
  if (!input) return new Date()
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: toAbsoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: toAbsoluteUrl('/courses'), changeFrequency: 'daily', priority: 0.9 },
    { url: toAbsoluteUrl('/posts'), changeFrequency: 'daily', priority: 0.8 },
    { url: toAbsoluteUrl('/events'), changeFrequency: 'daily', priority: 0.8 },
    { url: toAbsoluteUrl('/achievements'), changeFrequency: 'weekly', priority: 0.8 },
    { url: toAbsoluteUrl('/members'), changeFrequency: 'weekly', priority: 0.7 },
    { url: toAbsoluteUrl('/teams'), changeFrequency: 'weekly', priority: 0.7 },
    { url: toAbsoluteUrl('/projects'), changeFrequency: 'weekly', priority: 0.7 },
    { url: toAbsoluteUrl('/shop'), changeFrequency: 'weekly', priority: 0.7 },
    { url: toAbsoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.6 },
    { url: toAbsoluteUrl('/sponsors'), changeFrequency: 'monthly', priority: 0.6 },
    { url: toAbsoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.5 },
    { url: toAbsoluteUrl('/verify-certificate'), changeFrequency: 'monthly', priority: 0.5 },
  ]

  let payload: Awaited<ReturnType<typeof getPayload>>
  try {
    payload = await getPayload({ config: await config })
  } catch {
    return staticPages
  }

  try {
    const [courses, posts, events, achievements, members, teams, projects] = await Promise.all([
      payload.find({
        collection: 'courses',
        where: { status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'events' as any,
        where: { status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'achievements',
        where: { status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'members',
        where: {
          and: [
            { isActive: { equals: true } },
            {
              or: [
                { directoryApprovalStatus: { equals: 'approved' } },
                { directoryApprovalStatus: { exists: false } },
              ],
            },
          ],
        },
        select: { username: true, memberId: true, updatedAt: true },
        depth: 0,
        limit: 5000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'teams' as any,
        where: { status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'projects' as any,
        where: { status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
    ])

    const coursePages = (courses.docs as SlugDoc[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/courses/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

    const postPages = (posts.docs as SlugDoc[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/posts/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    const eventPages = (events.docs as SlugDoc[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/events/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

    const achievementPages = (achievements.docs as SlugDoc[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/achievements/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))

    const profilePages = (members.docs as MemberDoc[])
      .map((doc) => ({ slug: doc.username || doc.memberId, updatedAt: doc.updatedAt }))
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/profile/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))

    const teamPages = (teams.docs as SlugDoc[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/teams/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    const projectPages = (projects.docs as SlugDoc[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: toAbsoluteUrl(`/projects/${doc.slug}`),
        lastModified: toDate(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    return [
      ...staticPages,
      ...coursePages,
      ...postPages,
      ...eventPages,
      ...achievementPages,
      ...profilePages,
      ...teamPages,
      ...projectPages,
    ]
  } catch {
    return staticPages
  }
}
