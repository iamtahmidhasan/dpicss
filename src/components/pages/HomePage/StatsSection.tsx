'use client'

import { motion } from 'framer-motion'
import { BarChart3, Calendar, MessageSquare } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'
import type { HomePageStats } from './types'

type StatsSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  stats: HomePageStats
}

export default function StatsSection({ lang, homeSettings, stats }: StatsSectionProps) {
  const s = homeSettings.stats
  const statsMeta = [
    { icon: BarChart3, label: localizedField(s?.memberGrowth, lang) },
    { icon: Calendar, label: localizedField(s?.weeklyMeetups, lang) },
    { icon: MessageSquare, label: localizedField(s?.communityTalks, lang) },
  ]

  return (
    <section className="border-t border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(234,179,8,0.08),transparent_25%)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">
            {localizedField(s?.badge, lang)}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {localizedField(s?.title, lang)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {localizedField(s?.subtitle, lang)}
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_minmax(300px,0.7fr)]">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { value: stats.members, label: localizedField(s?.members, lang) },
              { value: stats.courses, label: localizedField(s?.courses, lang) },
              { value: stats.posts, label: localizedField(s?.posts, lang) },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="border border-border/70 bg-card/90 shadow-sm shadow-slate-950/5"
              >
                <CardContent className="space-y-2 p-6">
                  <p className="text-4xl font-semibold text-primary">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4">
            {statsMeta.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="rounded-3xl border border-border/70 bg-background/90 p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {localizedField(s?.[`detail${index + 1}` as 'detail1' | 'detail2' | 'detail3'], lang)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
