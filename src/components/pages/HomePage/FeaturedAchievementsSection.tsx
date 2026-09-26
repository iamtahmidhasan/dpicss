'use client'

import { motion } from 'framer-motion'
import { Trophy, Calendar, MapPin, Medal, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { HomeSettingsData } from '@/globals/types'
import type { AppLocale } from '@/lib/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@/components/kibo-ui/marquee'

type AchievementData = {
  id: string
  title: string
  slug?: string
  summary?: string
  coverImage?: { url?: string }
  achievementDate?: string
  venue?: string
  organizer?: string
  badge?: string
}

type FeaturedAchievementsSectionProps = {
  homeSettings: HomeSettingsData
  lang: AppLocale
  achievements: AchievementData[]
  className?: string
}

const badgeColors: Record<string, string> = {
  Champion: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  Winner: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  Finalist: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function FeaturedAchievementsSection({
  homeSettings,
  lang,
  achievements,
  className,
}: FeaturedAchievementsSectionProps) {
  if (!achievements || achievements.length === 0) return null

  // Layout Logic: 1 Hero, 2 Secondary
  const featured = achievements[0]
  const sideAchievements = achievements.slice(1, 3)

  // Extract unique organizers for the Marquee
  const organizers = Array.from(new Set(achievements.map((a) => a.organizer).filter(Boolean)))

  return (
    <section className={cn('py-32 px-4 md:px-0', className)}>
      <div className="container mx-auto max-w-7xl">
        {/* Header Section - Matches About3 Typography */}
        <div className="mb-14 flex flex-col gap-5 lg:w-2/3">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
            <Badge
              variant="outline"
              className="mb-4 border-primary/30 text-primary uppercase tracking-widest"
            >
              {homeSettings.achievementsSection.badge || 'Hall of Fame'}
            </Badge>
          </motion.div>
          <h1 className="text-5xl font-semibold tracking-tighter lg:text-7xl">
            {homeSettings.achievementsSection.title || 'Our Achievements'}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed max-w-2xl">
            {homeSettings.achievementsSection.subtitle ||
              'A legacy of innovation and competitive excellence in global robotics.'}
          </p>
        </div>

        {/* Main Grid - Asymmetric 2:1 Layout */}
        <div className="grid gap-7 lg:grid-cols-3">
          {/* FEATURED HERO ACHIEVEMENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="group relative flex min-h-[500px] flex-col justify-end overflow-hidden rounded-[2.5rem] bg-muted lg:col-span-2 shadow-2xl"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={
                  featured.coverImage?.url ||
                  'https://images.unsplash.com/photo-1567427017947-545c5f83c713?w=1200&q=80'
                }
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt={featured.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>

            <div className="relative z-10 space-y-4 p-8 md:p-12">
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    'py-1 px-4 text-sm border-0 backdrop-blur-md',
                    badgeColors[featured.badge || ''] || 'bg-white/20 text-white',
                  )}
                >
                  <Trophy className="mr-2 size-4" />
                  {featured.badge}
                </Badge>
                <span className="text-sm font-medium text-white/70 uppercase tracking-widest">
                  {formatDate(featured.achievementDate)}
                </span>
              </div>
              <h3 className="text-4xl font-bold text-white md:text-5xl tracking-tight max-w-2xl">
                {featured.title}
              </h3>
              <p className="text-lg text-white/80 line-clamp-2 max-w-xl">{featured.summary}</p>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-black hover:bg-white/90 group/btn"
              >
                <Link href={`/achievements/${featured.slug}`}>
                  Read Success Story
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* SIDEBAR ACHIEVEMENTS */}
          <div className="flex flex-col gap-7 md:flex-row lg:flex-col">
            {sideAchievements.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col justify-between gap-6 rounded-[2rem] bg-muted/50 border border-border/50 p-8 md:w-1/2 lg:w-auto transition-all hover:bg-muted"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Medal className="size-6" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      {formatDate(item.achievementDate)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/achievements/${item.slug}`}
                  className="inline-flex items-center text-sm font-bold text-primary hover:underline"
                >
                  CASE STUDY <ArrowRight className="ml-2 size-4" />
                </Link>
              </motion.div>
            ))}

            {/* THE BREAKOUT CTA (Matches About3 style) */}
            <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground grow">
              <Star className="absolute -right-4 -top-4 size-24 opacity-10 rotate-12" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <p className="text-lg font-bold leading-tight">Want to see our full legacy?</p>
                <Button variant="secondary" className="mt-6 w-full rounded-full" asChild>
                  <Link href="/achievements">
                    Full Archive
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ORGANIZER MARQUEE - Matches About3 Company Logos */}
        {organizers.length > 0 && (
          <div className="py-32">
            <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground mb-12">
              Competitions & Partners
            </p>
            <Marquee>
              <MarqueeContent speed={30}>
                {organizers.map((org, idx) => (
                  <MarqueeItem key={idx} className="mx-12 flex items-center">
                    <span className="text-2xl font-black italic tracking-tighter text-muted-foreground/30 hover:text-primary transition-colors">
                      {org}
                    </span>
                  </MarqueeItem>
                ))}
              </MarqueeContent>
              <MarqueeFade side="left" />
              <MarqueeFade side="right" />
            </Marquee>
          </div>
        )}

        {/* NUMBERS BREAKOUT - Matches About3 Stats */}
        <div className="relative overflow-hidden rounded-[3rem] bg-foreground p-10 md:p-20 text-background">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Competitions Won', value: '12' },
              { label: 'Awards Earned', value: '45+' },
              { label: 'Countries Visited', value: '08' },
              { label: 'Technical Papers', value: '20+' },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-2 border-l border-background/20 pl-6">
                <span className="font-mono text-5xl font-bold tracking-tighter text-primary">
                  {stat.value}
                </span>
                <p className="text-sm font-bold uppercase tracking-widest opacity-60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
