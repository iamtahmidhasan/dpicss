'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Code2, Globe, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ProjectData = {
  id: string
  slug?: string
  title?: string
  shortDescription?: string
  thumbnail?: { url?: string } | string
  category?: string
  technologies?: { name?: string }[]
  status?: string
  githubUrl?: string
  demoUrl?: string
}

type FeaturedProjectsSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  projects: ProjectData[]
  className?: string
}

export default function FeaturedProjectsSection({
  lang,
  homeSettings,
  projects,
  className,
}: FeaturedProjectsSectionProps) {
  if (!projects || projects.length === 0) return null

  const getThumbnail = (thumb: any) => {
    if (typeof thumb === 'object' && thumb?.url) return thumb.url
    if (typeof thumb === 'string') return thumb
    return 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1200'
  }

  // We take the first 3 projects for the bento layout
  const featuredProject = projects[0]
  const secondaryProjects = projects.slice(1, 3)

  return (
    <section className={cn('px-4 py-10 mx-auto max-w-7xl md:py-10', className)}>
      <div className="w-full">
        {/* Header Section: Following the exact gap and size of ProgramsSection */}
        <div className="mb-16 flex flex-col gap-5 lg:w-2/3">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {localizedField(homeSettings.projectsSection?.title, lang) || 'Featured Work'}
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
            {localizedField(homeSettings.projectsSection?.subtitle, lang) ||
              'A showcase of our latest technical achievements and robotic innovations.'}
          </p>
        </div>

        {/* Feature Grid: Asymmetric Bento Style */}
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Main Featured Card (Large) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-muted p-8 lg:col-span-2 lg:row-span-2 min-h-[400px]"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={getThumbnail(featuredProject.thumbnail)}
                alt={featuredProject.title}
                className="h-full w-full object-cover opacity-30 grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex gap-2 mb-4">
                <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                  {featuredProject.category || 'Featured'}
                </Badge>
                {featuredProject.status && (
                  <Badge
                    variant="outline"
                    className="bg-background/20 backdrop-blur-md border-white/20 text-white"
                  >
                    {featuredProject.status}
                  </Badge>
                )}
              </div>

              <h3 className="text-3xl font-semibold mb-4 text-white">{featuredProject.title}</h3>
              <p className="max-w-md text-muted-foreground text-lg mb-6 line-clamp-2">
                {featuredProject.shortDescription}
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href={`/projects/${featuredProject.slug || featuredProject.id}`}
                  className="flex items-center gap-2 text-primary font-medium hover:underline transition-all"
                >
                  Explore Project <ArrowUpRight className="size-4" />
                </Link>
                {featuredProject.githubUrl && (
                  <a
                    href={featuredProject.githubUrl}
                    className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe className="size-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Secondary Stacked Cards */}
          {secondaryProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:bg-muted/50"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Code2 className="size-6" />
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {project.category}
                  </Badge>
                </div>

                <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {project.shortDescription}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between relative z-10">
                <Link
                  href={`/projects/${project.slug || project.id}`}
                  className="flex items-center gap-2 text-sm font-semibold hover:underline"
                >
                  View Details <ExternalLink className="size-3" />
                </Link>

                {/* Decorative background number */}
                <span className="absolute -bottom-4 -right-2 text-8xl font-bold opacity-[0.03] select-none pointer-events-none">
                  0{idx + 2}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Footer: Adjusted to maintain the clean aesthetic */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <Button asChild variant="outline" size="lg" className="rounded-full border-2">
            <Link href="/projects">
              {localizedField(homeSettings.projectsSection?.viewAll, lang) || 'View All Projects'}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
