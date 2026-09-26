import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, ArrowLeft, Calendar, Star } from 'lucide-react'
import { type Where } from 'payload'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { TeamsSettingsData } from '@/globals/types'
import type { Metadata } from 'next'

type MemberRow = {
  id: string
  slug?: string
  username?: string
  memberId?: string
  avatar?: { url?: string } | string | null
  firstName?: string
  lastName?: string
  memberType?: string
  bio?: string
  level?: number
}

type Member = {
  id: string
  slug?: string
  username?: string
  memberId?: string
  avatar?: { url?: string } | string | null
  firstName?: string
  lastName?: string
  bio?: string
}

type Category = {
  id: string
  name?: unknown
  color?: string
}

type TeamDetail = {
  id: string
  name?: unknown
  slug?: string
  tagline?: unknown
  description?: unknown
  featuredImage?: { url?: string } | string | null
  members?: Member[]
  category?: Category | null
  featured?: boolean
  createdAt?: string
  meta?: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    ogTitle?: string
    ogDescription?: string
    twitterCard?: string
    twitterTitle?: string
    twitterDescription?: string
  }
}

type MemberAvatarRow = {
  id: string
  avatar?: { url?: string } | string | null
  firstName?: string
  lastName?: string
  username?: string
  memberId?: string
}

function formatMemberName(member: Member): string {
  const first = member.firstName || ''
  const last = member.lastName || ''
  return `${first} ${last}`.trim() || 'Team Member'
}

function getInitials(member: Member): string {
  const first = member.firstName?.[0] || ''
  const last = member.lastName?.[0] || ''
  return `${first}${last}`.toUpperCase() || 'M'
}

function getProfileSlug(member: Member): string {
  return member.username || member.slug || member.memberId || member.id
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()

  const result = await payload.find({
    collection: 'teams' as any,
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  if (result.docs.length === 0) {
    return { title: 'Team Not Found | DPI Robotics Club' }
  }

  const team = result.docs[0] as TeamDetail
  const name = pickLocalizedString(team.name, locale) || 'Team'
  const tagline = pickLocalizedString(team.tagline, locale)

  const ogImage =
    team.featuredImage && typeof team.featuredImage === 'object' && team.featuredImage.url
      ? team.featuredImage.url
      : undefined

  return {
    title: team.meta?.metaTitle || `${name} | DPI Robotics Club`,
    description: team.meta?.metaDescription || tagline || undefined,
    keywords: team.meta?.metaKeywords
      ? team.meta.metaKeywords.split(',').map((k) => k.trim())
      : undefined,
    openGraph: {
      title: team.meta?.ogTitle || name,
      description: team.meta?.ogDescription || tagline,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: team.meta?.twitterCard
      ? {
          card: team.meta.twitterCard as 'summary' | 'summary_large_image',
          title: team.meta?.twitterTitle || name,
          description: team.meta?.twitterDescription || tagline,
          images: ogImage ? [ogImage] : undefined,
        }
      : undefined,
  }
}

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug

  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const s = await getGlobalPayload<TeamsSettingsData>('teams-settings', locale)

  const result = await payload.find({
    collection: 'teams' as any,
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
    overrideAccess: true,
    ...locOpts,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const team = result.docs[0] as TeamDetail
  const name = pickLocalizedString(team.name, locale) || 'Unnamed Team'
  const tagline = pickLocalizedString(team.tagline, locale)
  const description = pickLocalizedString(team.description, locale)
  const categoryName = team.category
    ? pickLocalizedString(team.category.name, locale)
    : null
  const imageUrl =
    team.featuredImage && typeof team.featuredImage === 'object'
      ? team.featuredImage.url
      : undefined
  const members = team.members || []

  const memberIds = members.map((m) => m.id)
  let memberDetails: MemberRow[] = members as unknown as MemberRow[]

  if (memberIds.length > 0) {
    const whereClause: Where = {
      and: [
        { id: { in: memberIds } },
        { isActive: { equals: true } },
        {
          or: [
            { directoryApprovalStatus: { equals: 'approved' } },
            { directoryApprovalStatus: { exists: false } },
          ],
        },
      ],
    }

    const memberResult = await payload.find({
      collection: 'members',
      where: whereClause,
      depth: 0,
      limit: 50,
      overrideAccess: true,
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
      },
    })

    memberDetails = memberResult.docs as MemberRow[]
  }

  function resolveAvatarUrl(avatar: MemberRow['avatar']): string | undefined {
    if (!avatar) return undefined
    if (typeof avatar === 'object' && 'url' in avatar && avatar.url) {
      return avatar.url
    }
    return undefined
  }

  function generateFallbackAvatar(displayName: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=96`
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/teams">
          <ArrowLeft className="mr-2 size-4" />
          {s.backToTeams}
        </Link>
      </Button>

      <div className="mb-8">
        <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Users className="size-16 text-muted-foreground/40" />
            </div>
          )}
          {team.featured && (
            <Badge className="absolute left-4 top-4 flex items-center gap-1" variant="default">
              <Star className="size-3 fill-current" />
              {s.featured}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            {tagline && <p className="mt-2 text-lg text-muted-foreground">{tagline}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryName && (
              <Badge variant="outline" className="text-sm">
                {categoryName}
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </div>

        {team.createdAt && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>
              {s.established}{' '}
              {new Date(team.createdAt).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}
      </div>

      {description && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      <div>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          {s.members.replace('{count}', String(members.length))}
        </h2>

        {memberDetails.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p>{s.noMembers}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {memberDetails.map((member) => {
              const profileSlug = getProfileSlug(member)
              const avatarUrl =
                member.avatar && typeof member.avatar === 'object'
                  ? member.avatar.url
                  : generateFallbackAvatar(`${member.firstName || ''} ${member.lastName || ''}`)

              return (
                <Link key={member.id} href={`/profile/${profileSlug}`} className="group block">
                  <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="size-20 text-lg ring-2 ring-background shadow-md">
                          <AvatarImage
                            src={avatarUrl}
                            alt={formatMemberName(member)}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-linear-to-br from-primary/10 to-primary/5 text-lg font-semibold">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 font-semibold leading-tight line-clamp-1">
                          {formatMemberName(member)}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          @{member.username || member.memberId}
                        </p>
                        {member.memberType && (
                          <Badge variant="secondary" className="mt-2 text-xs capitalize">
                            {member.memberType}
                          </Badge>
                        )}
                        {member.bio && (
                          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                            {member.bio}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            Level {member.level || 1}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
