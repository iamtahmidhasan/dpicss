import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import type { AppLocale } from '@/lib/locale'
import { getMessages } from '@/messages'
import type { User } from '@/payload-types'
import { ArrowRight, BookOpen, Clock3, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type DashboardProps = {
  user: User
  lang: AppLocale
}

type DashboardData = {
  enrollments: any[]
  recentActivity: Array<{
    id: string
    title: string
    description: string
    createdAt?: string
  }>
  achievements: any[]
  stats: {
    enrolledCourses: number
    totalAchievements: number
  }
}

type FindResult = {
  docs: any[]
  totalDocs: number
}

const emptyFindResult: FindResult = {
  docs: [],
  totalDocs: 0,
}

function isAccessDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const candidate = error as {
    message?: unknown
    status?: unknown
    statusCode?: unknown
    data?: { status?: unknown; statusCode?: unknown; errors?: Array<{ message?: unknown }> }
  }

  const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : ''
  const nestedMessage =
    Array.isArray(candidate.data?.errors) && typeof candidate.data?.errors[0]?.message === 'string'
      ? candidate.data.errors[0].message.toLowerCase()
      : ''

  const status =
    candidate.status ?? candidate.statusCode ?? candidate.data?.status ?? candidate.data?.statusCode
  const statusCode = typeof status === 'number' ? status : Number(status)

  if (statusCode === 401 || statusCode === 403) return true

  return (
    message.includes('forbidden') ||
    message.includes('not allowed') ||
    nestedMessage.includes('forbidden') ||
    nestedMessage.includes('not allowed')
  )
}

async function safeFind(query: Promise<{ docs: any[]; totalDocs: number }>): Promise<FindResult> {
  try {
    return await query
  } catch (error) {
    if (isAccessDeniedError(error)) {
      return emptyFindResult
    }
    throw error
  }
}

async function getDashboardData(userId: string, user: User): Promise<DashboardData> {
  const payload = await getPayload({ config: await config })

  const isOfficial = user.memberCategory === 'official'
  const profileCollection = isOfficial ? 'members' : 'unofficial-members'

  // Type-safe where construction
  let profileWhere: Where
  if (isOfficial) {
    profileWhere = { user: { equals: userId } }
  } else {
    profileWhere = {
      or: [{ user: { equals: userId } }, { email: { equals: user.email } }],
    }
  }

  const [enrollments, profiles] = await Promise.all([
    safeFind(
      payload.find({
        collection: 'enrollments',
        where: { student: { equals: userId } },
        depth: 2,
        limit: 10,
        user,
        overrideAccess: false,
      }),
    ),
    safeFind(
      payload.find({
        collection: profileCollection,
        where: profileWhere,
        depth: 1,
        limit: 1,
        user,
        overrideAccess: false,
      }),
    ),
  ])

  const enrolledCourses = enrollments.totalDocs
  const profile = profiles.docs[0] as
    | {
        id?: string
        certificateId?: string
        certificateCourse?: { title?: string } | string
        createdAt?: string
        updatedAt?: string
      }
    | undefined
  const courseTitle =
    profile?.certificateCourse && typeof profile.certificateCourse === 'object'
      ? profile.certificateCourse.title
      : undefined
  const achievements = profile?.certificateId
    ? [
        {
          id: String(profile.id || profile.certificateId),
          title: courseTitle || 'Certificate Assigned',
          description: profile.certificateId,
          achievementDate: profile.updatedAt || profile.createdAt,
        },
      ]
    : []

  const recentActivity = [
    {
      id: 'account-created',
      title: 'Account created',
      description: 'Your account is now active on the platform.',
      createdAt: user.createdAt,
    },
    ...enrollments.docs.map((enrollment: any) => ({
      id: `enrollment:${enrollment.id}`,
      title: 'Course enrolled',
      description: enrollment.course?.title || 'Untitled course',
      createdAt: enrollment.createdAt,
    })),
    ...(profile?.certificateId
      ? [
          {
            id: `certificate:${profile.id || profile.certificateId}`,
            title: 'Certificate assigned',
            description: courseTitle || profile.certificateId,
            createdAt: profile.updatedAt || profile.createdAt,
          },
        ]
      : []),
  ]
    .filter((item) => Boolean(item.createdAt))
    .sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
    )
    .slice(0, 6)

  return {
    enrollments: enrollments.docs,
    recentActivity,
    achievements,
    stats: {
      enrolledCourses,
      totalAchievements: achievements.length,
    },
  }
}

function initialsFromEmail(email?: string | null): string {
  if (!email) return 'U'
  const local = email.split('@')[0]?.trim() || ''
  if (!local) return 'U'
  return local.slice(0, 2).toUpperCase()
}

function formatDate(value: unknown, lang: AppLocale): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(lang, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function Dashboard({ user, lang }: DashboardProps) {
  const data = await getDashboardData(user.id, user)
  const messages = getMessages(lang)
  const enrolledCourses = data.stats.enrolledCourses
  const totalAchievements = data.stats.totalAchievements
  const topEnrollments = data.enrollments.slice(0, 4)
  const topAchievements = data.achievements.slice(0, 4)
  const topActivities = data.recentActivity

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_42%),radial-gradient(circle_at_bottom_left,hsl(var(--chart-2)/0.18),transparent_38%)] text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 rounded-2xl border bg-card/85 p-5 shadow-sm backdrop-blur md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="ring-2 ring-primary/20">
                <AvatarFallback>{initialsFromEmail(user.email)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  {messages.dashboard?.welcomeBack || 'Welcome back'}
                </p>
                <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                  {user.email}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">
                  {messages.dashboard?.overview || "Here's an overview of your learning progress"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href="/courses">Browse Courses</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/account" className="inline-flex items-center gap-1">
                  Manage Account
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-primary/20 bg-card/90">
            <CardHeader className="pb-2">
              <CardDescription className="inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                <BookOpen className="size-3.5" />
                {messages.dashboard?.enrolledCourses || 'Enrolled Courses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{enrolledCourses}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/90">
            <CardHeader className="pb-2">
              <CardDescription className="inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                <GraduationCap className="size-3.5" />
                Certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{totalAchievements}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{messages.dashboard?.currentCourses || 'Current Courses'}</CardTitle>
              <CardDescription>
                {messages.dashboard?.coursesInProgress || "Courses you're currently enrolled in"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topEnrollments.length === 0 ? (
                <p className="text-muted-foreground">
                  {messages.dashboard?.noCourses || 'No courses enrolled yet'}
                </p>
              ) : (
                topEnrollments.map((enrollment: any, idx) => {
                  return (
                    <div key={enrollment.id}>
                      <div>
                        <h4 className="truncate text-sm font-semibold md:text-base">
                          {enrollment.course?.title || 'Untitled course'}
                        </h4>
                      </div>

                      {idx < topEnrollments.length - 1 ? <Separator className="mt-4" /> : null}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{messages.dashboard?.recentAchievements || 'Certificates'}</CardTitle>
              <CardDescription>
                {messages.dashboard?.latestAchievements || 'Certificates assigned to your profile'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAchievements.length === 0 ? (
                <p className="text-muted-foreground">
                  {messages.dashboard?.noAchievements || 'No certificates assigned yet'}
                </p>
              ) : (
                topAchievements.map((achievement: any, idx) => (
                  <div key={achievement.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold">
                          {achievement.title || 'Certificate'}
                        </h4>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(achievement.achievementDate, lang)}
                        </p>
                      </div>
                    </div>
                    {idx < topAchievements.length - 1 ? <Separator className="mt-4" /> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{messages.dashboard?.recentActivity || 'Recent Activity'}</CardTitle>
              <CardDescription>
                {messages.dashboard?.latestActions || 'Your recent account activity'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topActivities.length === 0 ? (
                <p className="text-muted-foreground">
                  {messages.dashboard?.noActivity || 'No recent activity'}
                </p>
              ) : (
                topActivities.map((activity: any, idx) => (
                  <div key={activity.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-muted p-1.5 text-muted-foreground">
                        <Clock3 className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{activity.title}</span>{' '}
                          <span className="text-muted-foreground">{activity.description}</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(activity.createdAt, lang)}
                        </p>
                      </div>
                    </div>
                    {idx < topActivities.length - 1 ? <Separator className="mt-4" /> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
