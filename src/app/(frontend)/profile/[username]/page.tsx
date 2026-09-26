import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import {
  User,
  BookOpen,
  Award,
  Calendar,
  Target,
  Star,
  Activity,
  MessageSquare,
  Ghost,
  Globe,
  Phone,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FluidMorphBg } from '@/components/ui/fluid-morph-bg'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ComplaintsPanel } from '@/components/complaints/ComplaintsPanel'
import config from '@/payload.config'
import { getCurrentUser } from '@/lib/payload-auth'
import { resolveMemberAvatarPublicUrl } from '@/lib/member-avatar-url'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { getMessages, t } from '@/messages'
import { pickLocalizedString } from '@/lib/localized-string'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, personJsonLd } from '@/lib/seo-structured'

type Args = {
  params: Promise<{ username: string }>
}

function relationId(ref: unknown): string | null {
  if (!ref) return null
  if (typeof ref === 'string') return ref
  if (typeof ref === 'object' && ref !== null && 'id' in ref) {
    const id = (ref as { id: unknown }).id
    if (id != null && id !== '') return String(id)
  }
  return null
}

function courseTitle(course: unknown, locale: 'en' | 'bn'): string {
  if (!course || typeof course !== 'object') return 'Course'
  return pickLocalizedString((course as { title?: unknown }).title, locale) || 'Course'
}

function courseShortDescription(course: unknown, locale: 'en' | 'bn'): string {
  if (!course || typeof course !== 'object') return ''
  return pickLocalizedString((course as { shortDescription?: unknown }).shortDescription, locale)
}

function courseSlug(course: unknown): string | null {
  if (!course || typeof course !== 'object') return null
  const s = (course as { slug?: unknown }).slug
  return typeof s === 'string' && s.trim() ? s : null
}

export default async function PublicProfilePage({ params }: Args) {
  const { username } = await params
  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const currentUser = await getCurrentUser()
  const requestLocale = await getRequestLocale()
  const loc: 'en' | 'bn' = requestLocale === 'bn' ? 'bn' : 'en'
  const messages = getMessages(loc)
  const locOpts = payloadLocaleOptions(loc)

  const result = await payload.find({
    collection: 'members',
    where: {
      or: [
        { username: { equals: username.toLowerCase() } },
        { memberId: { equals: username.toUpperCase() } },
      ],
    },
    limit: 1,
    depth: 1, // Reduced from 2: minimize relationship population
    select: {
      id: true,
      memberId: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      bio: true,
      memberType: true,
      level: true,
      skills: true,
      avatar: true,
      completedCourses: true,
      certificateId: true,
      certificateImageUrl: true,
      certificateCourse: true,
      complaints: true,
      createdAt: true,
      user: true,
      isActive: true,
      committeeRoles: true,
      directoryApprovalStatus: true,
      socialLinks: true,
    },
    ...locOpts,
    overrideAccess: true,
  })

  const member = result.docs[0] as Record<string, any>
  if (!member) {
    notFound()
  }

  const studentId = relationId(member.user)
  const directoryApproval = member.directoryApprovalStatus
  const allowPublicLearningStats =
    Boolean(member.isActive) &&
    (directoryApproval === 'approved' || directoryApproval === undefined)

  const enrollments =
    studentId != null
      ? await payload.find({
          collection: 'enrollments',
          where: { student: { equals: studentId } },
          depth: 1, // Reduced from 2
          limit: 50,
          select: {
            id: true,
            student: true,
            course: true,
            status: true,
            progress: true,
            enrolledAt: true,
            completedAt: true,
          },
          ...(allowPublicLearningStats
            ? { ...locOpts, overrideAccess: true }
            : { ...locOpts, user: currentUser ?? undefined, overrideAccess: false }),
        })
      : { docs: [], totalDocs: 0 }

  let avatarUrl = await resolveMemberAvatarPublicUrl(
    payload,
    member.avatar,
    `${member.firstName} ${member.lastName}`,
  )

  // Fall back to Google profile picture if no uploaded avatar
  if (!avatarUrl || avatarUrl.startsWith('https://ui-avatars.com')) {
    try {
      const userDoc = await payload.findByID({
        collection: 'users',
        id: studentId!,
        depth: 0,
        overrideAccess: true,
        select: { googlePicture: true },
      })
      const googlePic = typeof userDoc?.googlePicture === 'string' ? userDoc.googlePicture : null
      if (googlePic) avatarUrl = googlePic
    } catch {}
  }

  const isOwner = Boolean(currentUser && studentId && currentUser.id === studentId)
  const isAdmin = Boolean(currentUser?.roles?.includes('admin'))
  const showPendingBanner = isOwner && directoryApproval === 'pending'
  const showRejectedBanner = isOwner && directoryApproval === 'rejected'

  const complaints = Array.isArray(member.complaints)
    ? member.complaints
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const entry = item as Record<string, unknown>
          return {
            message: typeof entry.message === 'string' ? entry.message : undefined,
            status: typeof entry.status === 'string' ? entry.status : undefined,
            createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : []

  const completedList = []
  const displayName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
  const profileSchema = personJsonLd({
    urlPath: `/profile/${username}`,
    name: displayName || member.username || member.memberId || 'DPICS Member',
    description: member.bio || undefined,
    image: avatarUrl || undefined,
  })
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Home', urlPath: '/' },
    { name: 'Members', urlPath: '/members' },
    {
      name: displayName || member.username || member.memberId || 'Profile',
      urlPath: `/profile/${username}`,
    },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <JsonLd data={[profileSchema, breadcrumbSchema]} />
      {showPendingBanner && (
        <Alert className="mb-6 border-amber-500/40 bg-amber-500/10">
          <AlertTitle>{t(messages, 'profile.awaitingApproval')}</AlertTitle>
          <AlertDescription>{t(messages, 'profile.approvalMessage')}</AlertDescription>
        </Alert>
      )}
      {showRejectedBanner && (
        <Alert className="mb-6 border-destructive/40 bg-destructive/10">
          <AlertTitle>{t(messages, 'profile.notApproved')}</AlertTitle>
          <AlertDescription>{t(messages, 'profile.rejectionMessage')}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="relative p-6">
            <FluidMorphBg className="absolute inset-0" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                <AvatarImage
                  src={avatarUrl}
                  alt={`${member.firstName} ${member.lastName} profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-linear-to-br from-primary/20 to-primary/10">
                  {member.firstName?.[0] ?? '?'}
                  {member.lastName?.[0] ?? ''}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
                      {member.firstName} {member.lastName}
                    </h1>
                    <p className="flex items-center gap-2 text-sm text-white/70 sm:text-lg md:text-xl">
                      @{member.username || member.memberId}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="bg-white/15 text-white capitalize">
                        {member.memberType}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-white/80">
                        Level {member.level || 1}
                      </Badge>
                      {member.committeeRoles?.map((cr: any, i: number) => (
                        <Badge key={`c-${i}`} variant="secondary" className="bg-white/15 text-white">
                          {cr.committee?.name || 'Committee'}
                        </Badge>
                      ))}
                      {member.committeeRoles?.filter((cr: any) => cr.role).map((cr: any, i: number) => (
                        <Badge key={`r-${i}`} variant="outline" className="border-white/30 text-white/80">
                          {cr.role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {member.socialLinks?.facebook && (
                      <a
                        href={member.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          className="h-4 w-4 fill-white"
                        >
                          <path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z" />
                        </svg>
                        <span className="hidden sm:inline">{t(messages, 'profile.facebook')}</span>
                      </a>
                    )}
                    {member.socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${member.socialLinks.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          className="h-4 w-4 fill-white"
                        >
                          <path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" />
                        </svg>
                        <span className="hidden sm:inline">{t(messages, 'profile.whatsapp')}</span>
                      </a>
                    )}
                    {member.socialLinks?.linkedin && (
                      <a
                        href={member.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          className="h-4 w-4 fill-white"
                        >
                          <path d="M196.3 512L103.4 512L103.4 212.9L196.3 212.9L196.3 512zM149.8 172.1C120.1 172.1 96 147.5 96 117.8C96 103.5 101.7 89.9 111.8 79.8C121.9 69.7 135.6 64 149.8 64C164 64 177.7 69.7 187.8 79.8C197.9 89.9 203.6 103.6 203.6 117.8C203.6 147.5 179.5 172.1 149.8 172.1zM543.9 512L451.2 512L451.2 366.4C451.2 331.7 450.5 287.2 402.9 287.2C354.6 287.2 347.2 324.9 347.2 363.9L347.2 512L254.4 512L254.4 212.9L343.5 212.9L343.5 253.7L344.8 253.7C357.2 230.2 387.5 205.4 432.7 205.4C526.7 205.4 544 267.3 544 347.7L544 512L543.9 512z" />
                        </svg>
                        <span className="hidden sm:inline">{t(messages, 'profile.linkedin')}</span>
                      </a>
                    )}
                    {member.socialLinks?.github && (
                      <a
                        href={member.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          className="h-4 w-4 fill-white"
                        >
                          <path d="M280.5 426.5C214.5 418.5 168 371 168 309.5C168 284.5 177 257.5 192 239.5C185.5 223 186.5 188 194 173.5C214 171 241 181.5 257 196C276 190 296 187 320.5 187C345 187 365 190 383 195.5C398.5 181.5 426 171 446 173.5C453 187 454 222 447.5 239C463.5 258 472 283.5 472 309.5C472 371 425.5 417.5 358.5 426C375.5 437 387 461 387 488.5L387 540.5C387 555.5 399.5 564 414.5 558C505 523.5 576 433 576 321C576 179.5 461 64 319.5 64C178 64 64 179.5 64 321C64 432 134.5 524 229.5 558.5C243 563.5 256 554.5 256 541L256 501C249 504 240 506 232 506C199 506 179.5 488 165.5 454.5C160 441 154 433 142.5 431.5C136.5 431 134.5 428.5 134.5 425.5C134.5 419.5 144.5 415 154.5 415C169 415 181.5 424 194.5 442.5C204.5 457 215 463.5 227.5 463.5C240 463.5 248 459 259.5 447.5C268 439 274.5 431.5 280.5 426.5z" />
                        </svg>
                        <span className="hidden sm:inline">{t(messages, 'profile.github')}</span>
                      </a>
                    )}
                    {member.socialLinks?.website && (
                      <a
                        href={member.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <Globe className="h-4 w-4 text-white" />
                        <span className="hidden sm:inline">{t(messages, 'profile.website')}</span>
                      </a>
                    )}
                  </div>
                </div>

                {pickLocalizedString(member.bio, loc) && (
                  <p className="mt-4 max-w-2xl text-white/70">
                    {pickLocalizedString(member.bio, loc)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" orientation="horizontal" className="w-full flex-col">
        <div className="overflow-x-auto no-scrollbar pb-1">
          <TabsList className="inline-flex min-w-max gap-2 px-1">
            <TabsTrigger
              value="overview"
              className="inline-flex min-w-30 items-center justify-center gap-2 whitespace-nowrap"
            >
              <User className="h-4 w-4" />
              {t(messages, 'profile.overview')}
            </TabsTrigger>
            <TabsTrigger
              value="enrollments"
              className="inline-flex min-w-35 items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              {t(messages, 'profile.enrollments')}
            </TabsTrigger>
            <TabsTrigger
              value="complaints"
              className="inline-flex min-w-35 items-center justify-center gap-2 whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4" />
              {t(messages, 'profile.complaints')}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="inline-flex min-w-30 items-center justify-center gap-2 whitespace-nowrap"
            >
              <Activity className="h-4 w-4" />
              {t(messages, 'profile.activity')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t(messages, 'profile.profileInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(messages, 'profile.memberId')}
                  </p>
                  <p className="font-mono text-sm">{member.memberId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(messages, 'profile.email')}
                  </p>
                  <p className="text-sm">{member.email}</p>
                </div>
                {member.skills && member.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t(messages, 'profile.skills')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill: any, index: any) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill.skill} ({skill.level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {member.committeeRoles?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {member.committeeRoles.flatMap((cr: any, i: number): { key: string; label: string }[] => {
                        const badges: { key: string; label: string }[] = []
                        const name = cr.committee?.name || 'Committee'
                        badges.push({ key: `c-${i}`, label: name })
                        if (cr.role) badges.push({ key: `r-${i}`, label: cr.role })
                        return badges
                      }).map((b: { key: string; label: string }) => (
                        <Badge key={b.key} variant="default" className="text-xs">
                          {b.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t(messages, 'profile.statistics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">
                      {t(messages, 'profile.currentLevel')}
                    </span>
                  </div>
                  <span className="font-semibold">{member.level || 1}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      {t(messages, 'profile.enrollments')}
                    </span>
                  </div>
                  <span className="font-semibold">{enrollments.totalDocs}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">
                      {t(messages, 'profile.certificates')}
                    </span>
                  </div>
                  <span className="font-semibold">{member.certificateId ? 1 : 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(messages, 'profile.courseEnrollments')}</CardTitle>
              <CardDescription>{t(messages, 'profile.enrollmentDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.docs.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.docs.map((enrollment) => {
                    const course = enrollment.course
                    const courseName = courseTitle(course, loc)
                    const slug = courseSlug(course)
                    const created =
                      'createdAt' in enrollment && enrollment.createdAt
                        ? new Date(String(enrollment.createdAt)).toLocaleDateString()
                        : ''
                    return (
                      <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{courseName}</h3>
                              {courseShortDescription(course, loc) ? (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {courseShortDescription(course, loc)}
                                </p>
                              ) : null}
                              <div className="flex items-center gap-4 text-sm">
                                {created ? (
                                  <span className="text-muted-foreground">
                                    {t(messages, 'profile.enrolled')}: {created}
                                  </span>
                                ) : null}
                                <Badge
                                  variant={
                                    enrollment.status === 'completed' ? 'default' : 'secondary'
                                  }
                                >
                                  {enrollment.status || 'active'}
                                </Badge>
                              </div>
                            </div>
                            {slug ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/courses/${slug}`}>
                                  {t(messages, 'profile.viewCourse')}
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t(messages, 'profile.noEnrollments')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="mt-6">
          <ComplaintsPanel
            complaints={complaints}
            canSubmit={isAdmin}
            memberId={String(member.memberId)}
            memberType="official"
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(messages, 'profile.recentActivity')}</CardTitle>
              <CardDescription>{t(messages, 'profile.activityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t(messages, 'profile.joinedDpics')}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {enrollments.docs.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t(messages, 'profile.enrolled')} {courseTitle(enrollment.course, loc)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {'createdAt' in enrollment && enrollment.createdAt
                          ? new Date(String(enrollment.createdAt)).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}

                {member.certificateId ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t(messages, 'profile.assignedCertificate')}{' '}
                        {member.certificateCourse && typeof member.certificateCourse === 'object'
                          ? courseTitle(member.certificateCourse, loc)
                          : 'course'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(messages, 'profile.certificateId')}: {member.certificateId}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
