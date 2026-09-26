import { headers as getHeaders } from 'next/headers.js'
import { cookies } from 'next/headers'
import { getPayloadWithRetry } from '@/lib/payload-safe'

import config from '@/payload.config'
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/locale'
import { getCache, setCache } from '@/lib/cache'
import { getGlobalPayload } from '@/lib/payload-globals'
import { resolveMemberAvatarUrlMap } from '@/lib/member-avatar-url'
import HomePage from '@/components/pages/HomePage'
import type { HomePageFeaturedData } from '@/components/pages/HomePage/types'
import type { HomeSettingsData } from '@/globals/types'

export const revalidate = 60

export default async function Page() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const { user } = await payload.auth({ headers })

  const cookieJar = await cookies()
  const lang = normalizeLocale(cookieJar.get(LOCALE_COOKIE)?.value)

  const [stats, featuredData, homeSettings] = await Promise.all([
    fetchStats(payload),
    fetchFeaturedData(payload),
    getGlobalPayload<HomeSettingsData>('home-settings', lang),
  ])

  return (
    <HomePage
      user={user}
      lang={lang}
      homeSettings={homeSettings}
      stats={stats}
      featuredData={featuredData}
    />
  )
}

async function fetchStats(payload: Awaited<ReturnType<typeof getPayloadWithRetry>>) {
  let stats = {
    members: 0,
    courses: 0,
    posts: 0,
  }

  try {
    const cacheKey = 'home:stats'
    const cached = await getCache<typeof stats>(cacheKey)

    if (cached) {
      stats = cached
    } else {
      const [membersData, coursesData, postsData] = await Promise.all([
        payload.find({
          collection: 'members',
          limit: 0,
          pagination: false,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'courses',
          limit: 0,
          pagination: false,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'posts',
          limit: 0,
          pagination: false,
          overrideAccess: true,
        }),
      ] as const)

      stats = {
        members: membersData.totalDocs || 0,
        courses: coursesData.totalDocs || 0,
        posts: postsData.totalDocs || 0,
      }

      await setCache(cacheKey, stats, 3600)
    }
  } catch {
    // Use default stats if fetch fails
  }

  return stats
}

async function fetchFeaturedData(
  payload: Awaited<ReturnType<typeof getPayloadWithRetry>>,
): Promise<HomePageFeaturedData> {
  const emptyData: HomePageFeaturedData = {
    projects: [],
    events: [],
    achievements: [],
    founders: [],
    courses: [],
    posts: [],
  }

  try {
    const cacheKey = 'home:featured'
    const cached = await getCache<HomePageFeaturedData>(cacheKey)

    if (cached) {
      return cached
    }

    const [projectsData, eventsData, achievementsData, foundersData, coursesData, postsData] =
      await Promise.all([
        payload.find({
          collection: 'projects' as any,
          where: { featured: { equals: true }, status: { equals: 'published' } },
          limit: 6,
          sort: '-createdAt',
          depth: 2,
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
            thumbnail: true,
            category: true,
            technologies: true,
            status: true,
            githubUrl: true,
            demoUrl: true,
          },
        }),
        payload.find({
          collection: 'events' as any,
          where: { featured: { equals: true }, status: { equals: 'published' } },
          limit: 6,
          sort: 'eventDate',
          depth: 2,
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            featuredImage: true,
            eventDate: true,
            endDate: true,
            venue: true,
            totalSeats: true,
            soldSeats: true,
            ticketPrice: true,
            ticketCurrency: true,
            status: true,
            category: true,
            organizer: true,
          },
        }),
        payload.find({
          collection: 'achievements' as any,
          where: { featured: { equals: true }, status: { equals: 'published' } },
          limit: 6,
          sort: '-achievementDate',
          depth: 2,
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            coverImage: true,
            achievementDate: true,
            venue: true,
            organizer: true,
            badge: true,
            status: true,
          },
        }),
        payload.find({
          collection: 'committees',
          where: { slug: { equals: 'founder' } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        }).then(async ({ docs: committees }) => {
          if (committees.length === 0) return { docs: [] }
          const committeeId = String(committees[0].id)
          return payload.find({
            collection: 'members',
            where: {
              and: [
                { isActive: { equals: true } },
                { 'committeeRoles.committee': { equals: committeeId } },
              ],
            },
            limit: 8,
            sort: 'createdAt',
            depth: 0,
            overrideAccess: true,
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
              bio: true,
              memberType: true,
              skills: true,
              socialLinks: true,
              user: true,
            },
          })
        }),
        payload.find({
          collection: 'courses',
          where: { isFeatured: { equals: true }, status: { equals: 'published' } },
          limit: 4,
          sort: '-createdAt',
          depth: 2,
          select: {
            id: true,
            title: true,
            shortDescription: true,
            thumbnail: true,
            category: true,
            level: true,
            duration: true,
            instructors: true,
            enrollmentCount: true,
            averageRating: true,
            pricing: true,
          },
        }),
        payload.find({
          collection: 'posts',
          where: { featured: { equals: true }, status: { equals: 'published' } },
          limit: 5,
          sort: '-publishedAt',
          depth: 2,
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            featuredImage: true,
            category: true,
            author: true,
            publishedAt: true,
            readingTime: true,
            viewCount: true,
            likeCount: true,
          },
        }),
      ])

    const featuredData: HomePageFeaturedData = {
      projects:
        (projectsData.docs || []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          shortDescription: p.shortDescription,
          thumbnail: p.thumbnail,
          category: p.category,
          technologies: p.technologies,
          status: p.status,
          githubUrl: p.githubUrl,
          demoUrl: p.demoUrl,
        })) || [],
      events:
        (eventsData.docs || []).map((event: any) => ({
          id: event.id,
          name: event.name,
          slug: event.slug,
          tagline: event.tagline,
          featuredImage: event.featuredImage,
          eventDate: event.eventDate,
          endDate: event.endDate,
          venue: event.venue,
          totalSeats: event.totalSeats,
          soldSeats: event.soldSeats,
          ticketPrice: event.ticketPrice,
          ticketCurrency: event.ticketCurrency,
          status: event.status,
          category: event.category,
          organizer: event.organizer,
        })) || [],
      achievements:
        (achievementsData.docs || []).map((a: any) => ({
          id: a.id,
          title: a.title || '',
          slug: a.slug,
          summary: a.summary,
          coverImage: a.coverImage,
          achievementDate: a.achievementDate,
          venue: a.venue,
          organizer: a.organizer,
          badge: a.badge,
          status: a.status,
        })) || [],
      founders: [],
      courses:
        (coursesData.docs || []).map((course: any) => ({
          id: course.id,
          title: course.title,
          shortDescription: course.shortDescription,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          duration: course.duration,
          instructors: course.instructors,
          enrollmentCount: course.enrollmentCount,
          averageRating: course.averageRating,
          pricing: course.pricing,
        })) || [],
      posts:
        (postsData.docs || []).map((post: any) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          category: post.category,
          author: post.author,
          publishedAt: post.publishedAt,
          readingTime: post.readingTime,
          viewCount: post.viewCount,
          likeCount: post.likeCount,
        })) || [],
    }

    const founderDocs = foundersData.docs || []
    const founderRows = founderDocs.map((member: any) => ({
      id: member.id,
      username: member.username,
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      fullName: member.fullName,
      avatar: member.avatar,
      bio: member.bio,
      memberType: member.memberType,
      skills: member.skills,
      socialLinks: member.socialLinks,
      user: member.user,
    }))

    // Batch-fetch googlePictures from linked user accounts
    const googlePicturesByMemberId = new Map<string, string>()
    try {
      const userIds = founderRows
        .map((m) => {
          const u = m.user
          if (typeof u === 'string') return u
          if (u && typeof u === 'object') return String((u as { id?: string }).id || '')
          return null
        })
        .filter(Boolean) as string[]

      if (userIds.length > 0) {
        const users = await payload.find({
          collection: 'users',
          where: { id: { in: userIds } },
          depth: 0,
          limit: Math.max(userIds.length, 1),
          overrideAccess: true,
          select: { id: true, googlePicture: true },
        })
        const userPicMap = new Map(
          users.docs
            .filter((u) => u.googlePicture)
            .map((u) => [String(u.id), String(u.googlePicture)]),
        )
        for (const m of founderRows) {
          const u = m.user
          let uid: string | null = null
          if (typeof u === 'string') uid = u
          else if (u && typeof u === 'object') uid = String((u as { id?: string }).id || '')
          if (uid && userPicMap.has(uid)) {
            googlePicturesByMemberId.set(String(m.id), userPicMap.get(uid)!)
          }
        }
      }
    } catch {}

    const avatarUrlMap = await resolveMemberAvatarUrlMap(payload, founderRows, googlePicturesByMemberId)
    featuredData.founders = founderRows.map((m) => ({
      ...m,
      avatar: avatarUrlMap.get(String(m.id)) || '',
    }))

    await setCache(cacheKey, featuredData, 1800)
    return featuredData
  } catch {
    return emptyData
  }
}
