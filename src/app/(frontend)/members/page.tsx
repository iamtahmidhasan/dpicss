import { getPayloadWithRetry } from '@/lib/payload-safe'

import config from '@/payload.config'
import { getCurrentUser } from '@/lib/payload-auth'
import {
  resolveMemberAvatarUrlMap,
  uiAvatarFallback,
  MemberAvatarRow,
} from '@/lib/member-avatar-url'
import { getCache, setCache } from '@/lib/cache'
import { MembersGrid } from '@/components/members/MembersGrid'
import { getRequestLocale } from '@/lib/i18n-server'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { MembersSettingsData } from '@/globals/types'

export default async function MembersPage() {
  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const currentUser = await getCurrentUser()
  const locale = await getRequestLocale()
  const settings = await getGlobalPayload<MembersSettingsData>('members-settings', locale)

  // Cache key for members (1 hour TTL). Bump v2 when select fields change.
  const membersCacheKey = 'members:active:approved:1-50:v4'
  const cached = await getCache<{ docs: unknown[] }>(membersCacheKey)

  let memberDocs: unknown[]

  if (cached) {
    memberDocs = cached.docs
  } else {
    // Load members with pagination (50 per page, not 1000)
    const members = await payload.find({
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
      sort: ['lastName', 'firstName'],
      depth: 1,
      limit: 50,
      user: currentUser ?? undefined,
      overrideAccess: false,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        memberId: true,
        bio: true,
        avatar: true,
        memberType: true,
        level: true,
        createdAt: true,
        user: true,
        committeeRoles: true,
      },
    })

    memberDocs = members.docs

    // Cache for 1 hour
    await setCache(membersCacheKey, { docs: members.docs }, 3600)
  }

  const members = { docs: memberDocs }

  // Batch-fetch googlePictures from linked user accounts
  const googlePicturesByMemberId = new Map<string, string>()
  try {
    const userIds = (members.docs as Record<string, unknown>[])
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
      // Map user -> member
      for (const m of members.docs as Record<string, unknown>[]) {
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

  const avatarUrlByMemberId = await resolveMemberAvatarUrlMap(
    payload,
    members.docs as MemberAvatarRow[],
    googlePicturesByMemberId,
  )

  const avatarUrlMap: Record<string, string> = {}
  for (const member of members.docs as MemberAvatarRow[]) {
    avatarUrlMap[member.id] =
      avatarUrlByMemberId.get(member.id) ??
      uiAvatarFallback(`${member.firstName} ${member.lastName}`)
  }

  // Fetch active committees for filter buttons
  const committees = await payload.find({
    collection: 'committees',
    where: { isActive: { equals: true } },
    sort: '-priority',
    depth: 0,
    limit: 50,
    overrideAccess: true,
  })

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{settings.title}</h1>
        <p className="text-muted-foreground mt-2">{settings.subtitle}</p>
      </div>

      <MembersGrid
        members={members.docs as any[]}
        avatarUrlMap={avatarUrlMap}
        committees={committees.docs as any[]}
      />
    </div>
  )
}
