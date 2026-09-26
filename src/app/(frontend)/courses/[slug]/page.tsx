import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@payload-config'
import { Award, BookOpen, CheckCircle2, Clock, Users } from 'lucide-react'
import {
  convertLexicalToHTMLAsync,
  defaultHTMLConvertersAsync,
} from '@payloadcms/richtext-lexical/html-async'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCurrentUser } from '@/lib/payload-auth'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { CoursesSettingsData } from '@/globals/types'
import {
  mediaUrl,
  priceForMember,
  totalLessonCount,
  type CourseDoc,
  type LessonRow,
  type ModuleRow,
} from '@/lib/courses/course-helpers'
import {
  CourseCurriculumLocked,
  CourseLearningClient,
  PlyrVideoPlayer,
} from '@/components/courses/course-learning-client'
import { DynamicEnrollmentButton } from '@/components/courses/DynamicEnrollmentButton'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, courseJsonLd } from '@/lib/seo-structured'
import { uiAvatarFallback, resolveMemberAvatarUrlMap, MemberAvatarRow } from '@/lib/member-avatar-url'

type PageProps = { params: Promise<{ slug: string }> }

function stripModulesForVisitor(modules: ModuleRow[] | undefined): ModuleRow[] {
  if (!modules?.length) return []
  return modules.map((mod) => ({
    ...mod,
    lessons: (mod.lessons || []).map((les) => {
      if (les.isFreePreview) return { ...les }
      return {
        ...les,
        videoUrl: undefined,
        videoFile: undefined,
        documentFile: undefined,
        documentContent: undefined,
      }
    }),
  }))
}

function findFreePreview(modules: ModuleRow[] | undefined): {
  moduleId: string
  lesson: LessonRow
} | null {
  if (!modules) return null
  for (const mod of modules) {
    const mid = mod.id || ''
    for (const les of mod.lessons || []) {
      if (les.isFreePreview && les.id) return { moduleId: mid, lesson: les }
    }
  }
  return null
}

async function richTextToHtml(data: unknown): Promise<string> {
  if (!data || typeof data !== 'object') return ''
  try {
    return await convertLexicalToHTMLAsync({
      converters: defaultHTMLConvertersAsync,
      data: data as never,
    })
  } catch {
    return ''
  }
}

export default async function CourseSinglePage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayloadWithRetry()
  const user = await getCurrentUser()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const settings = await getGlobalPayload<CoursesSettingsData>('courses-settings', locale)
  const detail = settings.detail

  const isOfficialViewer = user?.memberCategory === 'official'
  const result = await payload.find({
    collection: 'courses',
    where: isOfficialViewer
      ? {
          and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
        }
      : {
          and: [
            { slug: { equals: slug } },
            { status: { equals: 'published' } },
            {
              or: [{ memberType: { equals: 'unofficial' } }, { memberType: { equals: 'both' } }],
            },
          ],
        },
    limit: 1,
    depth: 1,
    select: {
      id: true, title: true, slug: true, shortDescription: true, description: true,
      thumbnail: true, previewVideo: true, category: true, level: true, language: true,
      instructors: true, memberType: true, pricing: true, enrollmentContact: true,
      paymentInfo: true, duration: true, requirements: true, learningOutcomes: true,
      modules: true, enrollmentCount: true, averageRating: true, completionCount: true,
      status: true, publishedAt: true, isFeatured: true, certificateTemplate: true
    },
    ...locOpts,
  })

  if (!result.docs.length) notFound()

  const course = result.docs[0] as unknown as CourseDoc & { instructors?: (string | { id?: string })[] }
  const modules = (course.modules || []) as ModuleRow[]
  const lessonCount = totalLessonCount(modules)
  const descriptionHtml = await richTextToHtml(course.description)
  const thumb = mediaUrl(course.thumbnail)

  const courseInstructors = (course.instructors as unknown[]) || []
  const instructorMemberIds = courseInstructors
    .map((r) => {
      if (typeof r === 'string') return r
      if (typeof r === 'object' && r !== null && 'id' in r) return String((r as { id: unknown }).id)
      return null
    })
    .filter(Boolean) as string[]

  const instructorMembers =
    instructorMemberIds.length > 0
      ? await payload.find({
          collection: 'members',
          where: { id: { in: instructorMemberIds } },
          depth: 0,
          limit: 20,
          select: {
            id: true,
            user: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            level: true,
            skills: true,
          },
        })
      : { docs: [] }

  // Batch-fetch googlePictures for instructors
  const instructorGooglePics = new Map<string, string>()
  try {
    const instructorUserIds = (instructorMembers.docs as Record<string, unknown>[])
      .map((m) => {
        const u = m.user
        if (typeof u === 'string') return u
        if (u && typeof u === 'object') return String((u as { id?: string }).id || '')
        return null
      })
      .filter(Boolean) as string[]
    if (instructorUserIds.length > 0) {
      const users = await payload.find({
        collection: 'users',
        where: { id: { in: instructorUserIds } },
        depth: 0,
        limit: Math.max(instructorUserIds.length, 1),
        overrideAccess: true,
        select: { id: true, googlePicture: true },
      })
      const userPicMap = new Map(
        users.docs
          .filter((u) => u.googlePicture)
          .map((u) => [String(u.id), String(u.googlePicture)]),
      )
      for (const m of instructorMembers.docs as Record<string, unknown>[]) {
        const u = m.user
        let uid: string | null = null
        if (typeof u === 'string') uid = u
        else if (u && typeof u === 'object') uid = String((u as { id?: string }).id || '')
        if (uid && userPicMap.has(uid)) {
          instructorGooglePics.set(String(m.id), userPicMap.get(uid)!)
        }
      }
    }
  } catch {}

  const instructorAvatarUrlMap = await resolveMemberAvatarUrlMap(
    payload,
    instructorMembers.docs as MemberAvatarRow[],
    instructorGooglePics,
  )

  const memberById = new Map<string, Record<string, any>>()
  for (const m of instructorMembers.docs as Record<string, any>[]) {
    memberById.set(String(m.id), m)
  }

  function instructorDisplayName(member: Record<string, any> | undefined): string {
    if (!member) return 'Instructor'
    const name = pickLocalizedString(
      { en: `${member.firstName || ''} ${member.lastName || ''}`.trim(), bn: '' } as unknown,
      'en',
    )
    return name || 'Instructor'
  }

  function instructorInitials(member: Record<string, any> | undefined): string {
    if (!member) return 'I'
    const first = member.firstName || ''
    const last = member.lastName || ''
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || 'I'
  }

  const allInstructors = [...instructorMembers.docs]

  const memberCategory = user?.memberCategory === 'official' ? 'official' : 'unofficial'
  const price = priceForMember(course, memberCategory)
  const currency = course.pricing?.currency === 'USD' ? '$' : '৳'
  const unofficialPrice = priceForMember(course, 'unofficial')
  const officialPrice = priceForMember(course, 'official')

  let enrollment: { id: string; status?: string } | null = null
  let enrollmentStatus: string | null = null

  if (user) {
    const en = await payload.find({
      collection: 'enrollments',
      where: {
        and: [
          { student: { equals: user.id } },
          { course: { equals: course.id } },
          { status: { in: ['active', 'completed', 'pending'] } },
        ],
      },
      limit: 1,
      depth: 0,
      select: { id: true, status: true },
      user,
      overrideAccess: false,
    })
    if (en.docs[0]) {
      enrollmentStatus = String(en.docs[0].status)
      enrollment = {
        id: String(en.docs[0].id),
        status: enrollmentStatus,
      }
    }
  }

  const isActive = enrollmentStatus === 'active' || enrollmentStatus === 'completed'
  const isPending = enrollmentStatus === 'pending'
  const courseTitleForContact =
    pickLocalizedString(course.title as unknown, locale) || 'this course'
  const courseShortDescForSeo =
    pickLocalizedString(course.shortDescription as unknown, locale) ||
    'Robotics course from DPI Computing Society.'

  const visitorModules = stripModulesForVisitor(modules)
  const preview = findFreePreview(modules)
  const firstInstructorName = allInstructors.length > 0 ? instructorDisplayName(allInstructors[0]) : ''
  const courseSchema = courseJsonLd({
    urlPath: `/courses/${slug}`,
    title: courseTitleForContact,
    description: courseShortDescForSeo,
    image: thumb || undefined,
    instructorName: firstInstructorName,
  })
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Home', urlPath: '/' },
    { name: 'Courses', urlPath: '/courses' },
    { name: courseTitleForContact, urlPath: `/courses/${slug}` },
  ])

  const sidebarPrimary = (
    <DynamicEnrollmentButton
      course={{
        id: String(course.id),
        title: course.title as string | Record<string, string>,
        pricing: course.pricing as { member?: number; unofficial?: number; currency?: string } | undefined,
        memberType: course.memberType as 'official' | 'unofficial' | 'both' | undefined,
        paymentInfo: course.paymentInfo as {
          useCustomPayment?: boolean
          bkashNumber?: string
          nagadNumber?: string
          rocketNumber?: string
          cashInstructions?: string
        } | undefined,
        slug,
      }}
      locale={locale}
      price={price}
      currency={currency}
      isActive={isActive}
      isPending={isPending}
      userEmail={user?.email || null}
    />
  )

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <JsonLd data={[courseSchema, breadcrumbSchema]} />
      <div className={`grid gap-10 ${user && isActive ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        <div className={`space-y-6 ${user && isActive ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {course.level ? (
                <Badge variant="secondary" className="capitalize">
                  {course.level}
                </Badge>
              ) : null}
              {course.memberType ? (
                <Badge variant="outline">
                  {course.memberType === 'both'
                    ? detail.memberBoth
                    : course.memberType === 'official'
                      ? detail.memberOfficial
                      : detail.memberUnofficial}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {pickLocalizedString(course.title as unknown, locale) || course.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {pickLocalizedString(course.shortDescription as unknown, locale) ??
                course.shortDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {course.enrollmentCount ?? 0} {detail.students}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {course.duration?.totalHours != null
                ? `${course.duration.totalHours} ${detail.hours}`
                : detail.selfPaced}
            </span>
            <span className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              {lessonCount} {detail.lessonsCount}
            </span>
            <span className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              {detail.certificateBlurb}
            </span>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                {detail.tabsOverview}
              </TabsTrigger>
              <TabsTrigger value="curriculum" id="curriculum-tab">
                {detail.tabsCurriculum}
              </TabsTrigger>
              <TabsTrigger value="instructor">
                {detail.tabsInstructor}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-6">
              {course.previewVideo ? (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {detail.preview}
                  </h3>
                  <PlyrVideoPlayer
                    videoSrc={course.previewVideo}
                    title={pickLocalizedString(course.title as unknown, locale) || 'Course Preview'}
                  />
                </div>
              ) : null}
              {descriptionHtml ? (
                <div
                  className="prose prose-neutral max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : (
                <p className="text-muted-foreground">
                  {detail.noDescription}
                </p>
              )}
              {course.learningOutcomes?.length ? (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {detail.whatYouLearn}
                  </h3>
                  <ul className="space-y-2">
                    {course.learningOutcomes.map((o, i) =>
                      o.outcome ? (
                        <li key={i} className="flex gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                          <span>{o.outcome}</span>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </div>
              ) : null}
            </TabsContent>
            <TabsContent value="curriculum" className="mt-6 scroll-mt-24" id="curriculum">
              {isActive && enrollment ? (
                <CourseLearningClient
                  courseSlug={slug}
                  courseTitle={pickLocalizedString(course.title as unknown, locale) || 'Course'}
                  enrollmentId={enrollment.id}
                  modules={modules}
                />
              ) : (
                <CourseCurriculumLocked
                  modules={visitorModules}
                  showPreviewContent={Boolean(preview)}
                  previewLesson={preview}
                />
              )}
            </TabsContent>
            <TabsContent value="instructor" className="mt-6">
              {allInstructors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No instructors assigned.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {allInstructors.map((member) => {
                    const displayName = instructorDisplayName(member)
                    const initials = instructorInitials(member)
                    const profileSlug = member?.username || member?.memberId || ''
                    const profileHref = profileSlug ? `/profile/${profileSlug}` : null
                    const avatarUrl = instructorAvatarUrlMap.get(String(member.id)) || uiAvatarFallback(displayName)

                    const card = (
                      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                        <CardHeader className="pb-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
                              <AvatarImage
                                src={avatarUrl}
                                alt={`${displayName} profile picture`}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-lg font-semibold bg-linear-to-br from-primary/10 to-primary/5">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-semibold truncate">
                                {displayName}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                @{profileSlug || 'instructor'}
                              </CardDescription>
                              <div className="mt-1">
                                <Badge variant="secondary" className="capitalize">
                                  {detail.instructorRole || 'Instructor'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {member?.bio || 'Course instructor.'}
                          </p>
                        </CardContent>
                      </Card>
                    )

                    return profileHref ? (
                      <Link key={member.id} href={profileHref} className="group block">
                        {card}
                      </Link>
                    ) : (
                      <div key={member.id}>{card}</div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {user && isActive ? null : (
          <div className="lg:col-span-1">
            {!user || (!isActive && !isPending) ? (
              <div className="sticky top-24 overflow-hidden rounded-xl border bg-card shadow-sm">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="aspect-video bg-muted" />
                )}
                <div className="space-y-4 p-6">
              {!user || (!isActive && !isPending) ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {price <= 0 ? settings.free : `${currency}${price}`}
                  </span>
                  {!user && (officialPrice > 0 || unofficialPrice > 0) ? (
                    <span className="text-xs text-muted-foreground">
                      {detail.priceHintGuest
                        .replace('{u}', course.pricing?.currency === 'USD' ? `$${unofficialPrice}` : `৳${unofficialPrice}`)
                        .replace('{o}', course.pricing?.currency === 'USD' ? `$${officialPrice}` : `৳${officialPrice}`)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {!user || (!isActive && !isPending) ? sidebarPrimary : null}

              {!user ? (
                <p className="text-center text-xs text-muted-foreground">
                  {detail.noteGuest}
                </p>
              ) : !isActive && !isPending ? (
                <p className="text-center text-xs text-muted-foreground">
                  {detail.notePay}
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  {detail.noteEnrolled}
                </p>
              )}

              <Separator />

              {!user || (!isActive && !isPending) ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{detail.includesTitle}</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      {detail.include1}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      {detail.include2}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      {detail.include3}
                    </li>
                  </ul>
                </div>
              ) : null}

              <Separator />

              <Button variant="outline" className="w-full" asChild>
                <Link href="/courses">{detail.allCourses}</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/verify-certificate">{detail.verifyCert}</Link>
              </Button>
            </div>
          </div>
          ) : null}
        </div>
        )}
      </div>
    </div>
  )
}
