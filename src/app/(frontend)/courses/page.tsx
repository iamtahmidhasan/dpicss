import Link from 'next/link'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@payload-config'
import { BookOpen, Clock, Star, Users } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/payload-auth'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { CourseDoc } from '@/lib/courses/course-helpers'
import { mediaUrl, priceForMember, totalLessonCount } from '@/lib/courses/course-helpers'
import { cn } from '@/lib/utils'
import { getCache, setCache } from '@/lib/cache'
import type { CoursesSettingsData } from '@/globals/types'

type SearchParams = Promise<{ sort?: string }>

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

function categoryLabel(value: unknown, fallback: string): string {
  if (value == null || value === '') return fallback
  if (typeof value === 'string') {
    return value
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }
  if (typeof value === 'object' && value !== null) {
    const o = value as { title?: unknown; slug?: unknown; name?: unknown }
    if (typeof o.title === 'string' && o.title.trim()) return o.title.trim()
    if (typeof o.name === 'string' && o.name.trim()) return o.name.trim()
    if (typeof o.slug === 'string' && o.slug.trim()) return categoryLabel(o.slug, fallback)
  }
  return fallback
}

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const { sort = 'latest' } = await searchParams
  const popular = sort === 'popular'

  const payload = await getPayloadWithRetry()
  const user = await getCurrentUser()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const isOfficialViewer = user?.memberCategory === 'official'

  const coursesSettings = await getGlobalPayload<CoursesSettingsData>('courses-settings', locale)

  // Cache key based on user category and sort
  const cacheKey = [
    'courses',
    locale,
    popular ? 'popular' : 'latest',
    isOfficialViewer ? 'official' : 'unofficial',
  ].join(':')
  const cached = await getCache<{ docs: unknown[] }>(cacheKey)

  let courses: unknown[]

  if (cached) {
    courses = cached.docs
  } else {
    const result = await payload.find({
      collection: 'courses',
      where: isOfficialViewer
        ? { status: { equals: 'published' } }
        : {
            and: [
              { status: { equals: 'published' } },
              {
                or: [{ memberType: { equals: 'unofficial' } }, { memberType: { equals: 'both' } }],
              },
            ],
          },
      sort: popular ? '-enrollmentCount' : '-createdAt',
      depth: 1,
      limit: 60,
      ...locOpts,
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        category: true,
        thumbnail: true,
        pricing: true,
        modules: true,
        enrollmentCount: true,
        status: true,
        memberType: true,
      } as Record<string, boolean>,
    })

    courses = result.docs

    // Cache for 30 minutes
    await setCache(cacheKey, { docs: result.docs }, 1800)
  }

  const memberCategory = user?.memberCategory === 'official' ? 'official' : 'unofficial'

  const enrollmentByCourseId = new Map<string, { id: string }>()
  if (user) {
    // Cache enrollments per user (5 minute TTL)
    const enrollmentCacheKey = `enrollments:user:${user.id}:${locale}`
    const cachedEnrollments = await getCache<{ docs: unknown[] }>(enrollmentCacheKey)

    const enResult = cachedEnrollments
      ? cachedEnrollments
      : await payload.find({
          collection: 'enrollments',
          where: {
            and: [{ student: { equals: user.id } }, { status: { in: ['active', 'completed'] } }],
          },
          limit: 200,
          depth: 0,
          user,
          overrideAccess: false,
          ...locOpts,
        })

    if (!cachedEnrollments) {
      await setCache(enrollmentCacheKey, { docs: enResult.docs }, 300)
    }

    const en = enResult as unknown as {
      docs: Array<{ id: string; course: string | { id: string } }>
    }
    for (const row of en.docs) {
      const c = row.course
      const cid =
        typeof c === 'object' && c && 'id' in c ? String((c as { id: string }).id) : String(c)
      enrollmentByCourseId.set(cid, { id: String(row.id) })
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{coursesSettings.title}</h1>
          <p className="mt-1 text-muted-foreground">{coursesSettings.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={!popular ? 'default' : 'outline'} size="sm">
            <Link href="/courses?sort=latest">{coursesSettings.sortLatest}</Link>
          </Button>
          <Button asChild variant={popular ? 'default' : 'outline'} size="sm">
            <Link href="/courses?sort=popular">{coursesSettings.sortPopular}</Link>
          </Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {coursesSettings.empty}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((raw) => {
            const course = raw as unknown as CourseDoc
            const thumb = mediaUrl(course.thumbnail)
            const lessons = totalLessonCount(course.modules)
            const price = priceForMember(course, memberCategory)
            const currency = course.pricing?.currency === 'USD' ? '$' : '৳'
            const enrolled = user ? enrollmentByCourseId.get(course.id) : undefined
            const cta = !user
              ? { href: '/register', label: coursesSettings.joinToEnroll }
              : enrolled
                ? { href: `/courses/${course.slug}`, label: coursesSettings.startLearning }
                : {
                    href: `/courses/${course.slug}`,
                    label: coursesSettings.enrollNow,
                  }

            const slug = `/courses/${course.slug}`

            return (
              <Card
                key={course.id}
                className="group relative flex flex-col overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <Link
                  href={slug}
                  className="absolute inset-0 z-10"
                  aria-label={course.title}
                />
                <div className="relative aspect-video bg-muted">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <Badge className="absolute right-2 top-2 capitalize" variant="secondary">
                    {levelLabel[course.level || ''] || coursesSettings.levelUnknown}
                  </Badge>
                </div>
                <CardHeader className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {categoryLabel(course.category, coursesSettings.categoryFallback)}
                    </Badge>
                    <span className="ml-auto flex items-center gap-1 text-sm text-amber-600">
                      <Star className="size-4 fill-current" />
                      {typeof course.averageRating === 'number' && course.averageRating > 0
                        ? course.averageRating.toFixed(1)
                        : '—'}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg leading-snug">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {course.shortDescription}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {course.duration?.totalHours != null
                        ? `${course.duration.totalHours}${coursesSettings.hoursShort}`
                        : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" />
                      {lessons} {coursesSettings.lessons}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {course.enrollmentCount ?? 0} {coursesSettings.enrolled}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 p-4">
                  <div className="text-lg font-semibold">
                    {price <= 0 ? (
                      coursesSettings.free
                    ) : (
                      <span>
                        {currency}
                        {price}
                      </span>
                    )}
                  </div>
                  <Button asChild className={cn(!user && 'shrink-0')}>
                    <Link href={cta.href}>{cta.label}</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
