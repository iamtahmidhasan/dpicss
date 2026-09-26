import { cookies } from 'next/headers'
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/locale'
import { About3 } from '@/components/about3'
import { MissionVision } from '@/components/pages/AboutPage/mission-vision'
import { FounderSection } from '@/components/pages/AboutPage/founder-section'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getGlobalPayload } from '@/lib/payload-globals'
import { resolveMemberAvatarUrlMap } from '@/lib/member-avatar-url'
import type { AboutSettingsData } from '@/globals/types'

export default async function AboutPage() {
  const cookieJar = await cookies()
  const lang = normalizeLocale(cookieJar.get(LOCALE_COOKIE)?.value)
  const payload = await getPayloadWithRetry()

  const aboutSettings = await getGlobalPayload<AboutSettingsData>('about-settings', lang)

  const memberSelect = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    fullName: true,
    avatar: true,
    bio: true,
    memberType: true,
    user: true,
  } as const

  const fetchMembersForCommittee = async (committeeSlug: string) => {
    // First find the committee by slug
    const { docs: committees } = await payload.find({
      collection: 'committees',
      where: { slug: { equals: committeeSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (committees.length === 0) return []

    const committeeId = String(committees[0].id)

    // Then find members who have this committee in their committeeRoles
    const { docs } = await payload.find({
      collection: 'members',
      where: {
        and: [
          { isActive: { equals: true } },
          { 'committeeRoles.committee': { equals: committeeId } },
        ],
      },
      limit: 20,
      sort: 'createdAt',
      depth: 1,
      overrideAccess: true,
      select: {
        ...memberSelect,
        committeeRoles: true,
      } as any,
    })

    // Extract the role within this committee from committeeRoles
    return docs.map((member: any) => {
      const entry = (member.committeeRoles || []).find(
        (r: any) => String(r.committee) === committeeId,
      )
      return {
        id: member.id,
        username: member.username,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        fullName: member.fullName,
        avatar: member.avatar,
        bio: member.bio,
        memberType: member.memberType,
        user: member.user,
        committeeRole: entry?.role || '',
      }
    })
  }

  const [governingBodyRows, alumniAdvisorRows, executiveRows] = await Promise.all([
    fetchMembersForCommittee('governing-body'),
    fetchMembersForCommittee('alumni-advisor'),
    fetchMembersForCommittee('executive'),
  ])

  const resolveAvatars = async (rows: any[]) => {
    const googlePicturesByMemberId = new Map<string, string>()
    try {
      const userIds = rows
        .map((m: any) => {
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
            .filter((u: any) => u.googlePicture)
            .map((u: any) => [String(u.id), String(u.googlePicture)]),
        )
        for (const m of rows) {
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

    const avatarUrlMap = await resolveMemberAvatarUrlMap(payload, rows, googlePicturesByMemberId)
    return rows.map((m: any) => ({
      ...m,
      avatar: avatarUrlMap.get(String(m.id)) || '',
    }))
  }

  const [governingMembers, alumniAdvisors, executives] = await Promise.all([
    resolveAvatars(governingBodyRows),
    resolveAvatars(alumniAdvisorRows),
    resolveAvatars(executiveRows),
  ])

  return (
    <main className="bg-background">
      <About3 aboutSettings={aboutSettings} lang={lang} />
      <div className="space-y-24 pb-24 md:space-y-32 md:pb-32">
        <MissionVision aboutSettings={aboutSettings} lang={lang} alumniAdvisors={alumniAdvisors} executives={executives} />
        <FounderSection aboutSettings={aboutSettings} lang={lang} members={governingMembers} />
      </div>
    </main>
  )
}
