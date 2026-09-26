'use client'

import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Users, Clock, Star } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type CourseData = {
  id: string
  title?: string
  shortDescription?: string
  thumbnail?: { url?: string } | string
  category?: string
  level?: string
  duration?: { totalHours?: number; totalWeeks?: number }
  instructors?: { firstName?: string; lastName?: string; avatar?: { url?: string } }[]
  enrollmentCount?: number
  averageRating?: number
  pricing?: { officialMemberPrice?: number; unofficialMemberPrice?: number; currency?: string }
}

type FeaturedCoursesSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  courses: CourseData[]
  className?: string
}

const levelColors: Record<string, string> = {
  beginner: 'bg-cat-emerald/10 text-cat-emerald',
  intermediate: 'bg-cat-sky/10 text-cat-sky',
  advanced: 'bg-cat-rose/10 text-cat-rose',
}

export default function FeaturedCoursesSection({
  lang,
  homeSettings,
  courses,
  className,
}: FeaturedCoursesSectionProps) {
  if (!courses || courses.length === 0) return null

  const getThumbnail = (thumb: any) => {
    if (typeof thumb === 'object' && thumb?.url) return thumb.url
    if (typeof thumb === 'string') return thumb
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200'
  }

  const featuredCourse = courses[0]
  const secondaryCourses = courses.slice(1, 4)

  return (
    <section className={cn('px-4 py-10 mx-auto max-w-7xl md:py-10', className)}>
      <div className="w-full">
        <div className="mb-16 flex flex-col gap-5 lg:w-2/3">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {localizedField(homeSettings.coursesSection?.title, lang) || 'Featured Courses'}
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
            {localizedField(homeSettings.coursesSection?.subtitle, lang) ||
              'Master computing and technology with our expert-led courses designed for all skill levels.'}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-muted p-8 lg:col-span-2 lg:row-span-2 min-h-[400px]"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={getThumbnail(featuredCourse.thumbnail)}
                alt={featuredCourse.title || 'Course'}
                className="h-full w-full object-cover opacity-30 grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex gap-2 mb-4">
                {featuredCourse.level && (
                  <Badge className={levelColors[featuredCourse.level] || 'bg-primary/10 text-primary'}>
                    {featuredCourse.level.charAt(0).toUpperCase() + featuredCourse.level.slice(1)}
                  </Badge>
                )}
                {featuredCourse.category && (
                  <Badge className="bg-primary/10 text-primary border-none">
                    {featuredCourse.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                )}
              </div>

              <h3 className="text-3xl font-semibold mb-4">{featuredCourse.title}</h3>
              <p className="max-w-md text-muted-foreground text-lg mb-6 line-clamp-2">
                {featuredCourse.shortDescription}
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {featuredCourse.duration?.totalHours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {featuredCourse.duration.totalHours}h
                  </span>
                )}
                {featuredCourse.enrollmentCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" />
                    {featuredCourse.enrollmentCount} enrolled
                  </span>
                )}
                {featuredCourse.averageRating !== undefined && featuredCourse.averageRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 fill-warning text-warning" />
                    {featuredCourse.averageRating.toFixed(1)}
                  </span>
                )}
              </div>

              <Link
                href={`/courses/${featuredCourse.id}`}
                className="mt-6 inline-flex items-center gap-2 text-primary font-medium hover:underline transition-all"
              >
                Start Learning <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>

          {secondaryCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:bg-muted/50"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-6" />
                  </div>
                  {course.level && (
                    <Badge variant="outline" className={levelColors[course.level] || ''}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-3">{course.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {course.shortDescription}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {course.duration?.totalHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {course.duration.totalHours}h
                    </span>
                  )}
                  {course.enrollmentCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {course.enrollmentCount}
                    </span>
                  )}
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  className="flex items-center gap-2 text-sm font-semibold hover:underline"
                >
                  View Course <ArrowRight className="size-3" />
                </Link>
              </div>

              <span className="absolute -bottom-4 -right-2 text-8xl font-bold opacity-[0.03] select-none pointer-events-none">
                0{idx + 2}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <Button asChild variant="outline" size="lg" className="rounded-full border-2">
            <Link href="/courses">
              View All Courses
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
