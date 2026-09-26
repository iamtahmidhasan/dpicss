'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'

type CallToActionSectionProps = {
  user: boolean
  lang: AppLocale
  homeSettings: HomeSettingsData
}

export default function CallToActionSection({ user, lang, homeSettings }: CallToActionSectionProps) {
  const cta = homeSettings.cta

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto max-w-5xl rounded-[2rem] border border-border/70 bg-gradient-to-br from-background via-background to-muted/80 p-8 shadow-2xl shadow-foreground/10 dark:from-surface-inverse dark:via-surface-inverse dark:to-surface-inverse-elevated/95"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_minmax(280px,0.5fr)] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary/90">
              {localizedField(cta?.badge, lang)}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {localizedField(cta?.title, lang)}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              {localizedField(cta?.description, lang)}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button size="lg" asChild>
              <Link href={user ? '/account' : '/register'}>
                {user
                  ? localizedField(cta?.buttons?.dashboard, lang)
                  : localizedField(cta?.buttons?.join, lang)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={user ? '/members' : '/login'}>
                {user
                  ? localizedField(cta?.buttons?.explore, lang)
                  : localizedField(cta?.buttons?.login, lang)}
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
