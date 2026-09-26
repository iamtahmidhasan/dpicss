'use client'

import Link from 'next/link'
import { ArrowRight, Award, Calendar, CircuitBoard, Star } from 'lucide-react'

import {
  RotatingText,
  RotatingTextContainer,
} from '@/components/animate-ui/primitives/texts/rotating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'
import type { HomePageStats } from './types'
import LineSplitText from '@/components/LineSplitText'
import Image from 'next/image'
import { HERO_IMAGE_SRC } from '@/lib/hero-image'

type HeroSectionProps = {
  user: boolean
  lang: AppLocale
  homeSettings: HomeSettingsData
  stats: HomePageStats
  className?: string
}

export default function HeroSection({ user, lang, homeSettings, stats, className }: HeroSectionProps) {
  const rotatingWords = (homeSettings.titleRotating || [])
    .map((item: any) => localizedField(item.word, lang))
    .filter(Boolean)

  return (
    <section
      className={cn('relative overflow-hidden px-4 py-10 md:py-24 mx-auto max-w-7xl', className)}
    >
      <div className="w-full">
        {/* Top Section: Header & Action (Asymmetric Layout) */}
        <div className="grid gap-12 lg:grid-cols-3 items-end mb-16">
          <div className="lg:col-span-2 space-y-6">
            <Badge className="px-4 py-1.5 text-sm font-medium" variant="secondary">
              {localizedField(homeSettings.badge, lang) || 'New Season 2026'}
            </Badge>

            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              {localizedField(homeSettings.title1, lang)}
              <span className="block text-primary/60">
                <RotatingTextContainer inView={true} text={rotatingWords}>
                  <RotatingText />
                </RotatingTextContainer>
              </span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
              {localizedField(homeSettings.description, lang)}
            </p>
          </div>

          {/* Action Card - Mirroring About3 Sidebar Card */}
          <div className="flex-col gap-6 rounded-2xl bg-muted p-8 hidden lg:flex lg:p-10 border border-border/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div>
              <p className="text-xl font-semibold mb-2">Ready to Innovate?</p>
              <p className="text-muted-foreground text-sm">
                Join the largest student computing community in the region.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {!user ? (
                <Button size="lg" className="w-full group" asChild>
                  <Link href="/register">
                    {localizedField(homeSettings.buttons?.join, lang)}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full group" asChild>
                  <Link href="/account">
                    My Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Visual Content: Grid of Stats and Feature Image */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Hero Image - Large 2-column block */}
          <Link
            href="https://www.facebook.com/groups/511515031982050/"
            target="_blank"
            rel="noopener noreferrer"
            className="lg:col-span-2"
          >
            <div className="relative aspect-video lg:aspect-auto lg:h-[450px] overflow-hidden rounded-2xl bg-muted lg:col-span-2 group">
              <Image
                src={HERO_IMAGE_SRC}
                alt="Computing Lab"
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105 active:scale-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 flex gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      className="h-10 w-10 rounded-full border-2 border-background object-cover"
                      alt="member"
                    />
                  ))}
                </div>
                <div className="text-white">
                  <p className="text-xs font-medium uppercase opacity-80">Active Community</p>
                  <p className="text-sm font-bold">{stats.members}+ Members</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Side Stats Stack - Clean Minimalist style */}
          <div className="flex flex-row lg:flex-col  gap-4">
            <div className="flex flex-col w-full lg:h-full justify-center rounded-2xl border border-border p-8 text-left bg-card active:scale-95 transition-transform">
              <CircuitBoard className="mb-4 h-8 w-8 text-primary opacity-50" />
              <div className="text-4xl font-bold tracking-tighter md:text-5xl">
                {stats.courses.toLocaleString()}
              </div>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
                Workshops Hosted
              </p>
            </div>
            <div className="flex flex-col w-full lg:h-full justify-center rounded-2xl border border-border p-8 text-left bg-card active:scale-95 transition-transform">
              <Award className="mb-4 h-8 w-8 text-primary opacity-50" />
              <div className="text-4xl font-bold tracking-tighter md:text-5xl">
                {stats.posts.toLocaleString()}
              </div>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
                Achievements Shared
              </p>
            </div>
          </div>
        </div>

        {/* Floating Features - Repositioned to Footer of Hero */}
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/50 pt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Focus Areas:
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: Calendar, text: 'Weekly Meetups' },
              { icon: CircuitBoard, text: 'Hands-on Builds' },
              { icon: Award, text: 'Competition Ready' },
            ].map((feature, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                {feature.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
