import Link from 'next/link'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { BookOpen, Globe } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/payload-auth'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { ProjectsSettingsData } from '@/globals/types'
import {
  projectThumbnail,
  projectTechnologies,
  type ProjectDoc,
} from '@/lib/projects/project-helpers'

const keyedLookup = (items: Array<{ key: string; label: string }>) =>
  new Map(items.map((i) => [i.key, i.label]))

export default async function ProjectsPage() {
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const payload = await getPayloadWithRetry()
  const currentUser = await getCurrentUser()

  const settings = await getGlobalPayload<ProjectsSettingsData>('projects-settings', locale)
  const categoryLabel = keyedLookup(settings.categories || [])
  const statusLabel = keyedLookup(settings.status || [])

  const projectsData = await (payload as any).find({
    collection: 'projects',
    where: { status: { equals: 'published' } },
    depth: 2,
    limit: 50,
    sort: '-createdAt',
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      thumbnail: true,
      category: true,
      technologies: true,
      status: true,
      featured: true,
      githubUrl: true,
      demoUrl: true,
      startDate: true,
      endDate: true,
      teamMembers: true,
    },
    user: currentUser ?? undefined,
    overrideAccess: false,
    ...locOpts,
  })

  const projects = projectsData.docs as unknown as ProjectDoc[]
  const featuredProjects = projects.filter((p) => p.featured)
  const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{settings.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{settings.subtitle}</p>
      </div>

      {featuredProjects.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">{settings.featured}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.slice(0, 3).map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  {projectThumbnail(project) && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={projectThumbnail(project) || ''}
                        alt={pickLocalizedString(project.title as unknown, locale) || settings.projectImageAlt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-lg">
                        {pickLocalizedString(project.title as unknown, locale)}
                      </CardTitle>
                      {project.category && (
                        <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                          {categoryLabel.get(project.category) || project.category}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {pickLocalizedString(project.shortDescription as unknown, locale)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectTechnologies(project).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {projectTechnologies(project)
                          .slice(0, 4)
                          .map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-semibold">{settings.all}</h2>
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="cursor-pointer capitalize hover:bg-muted"
              >
                {categoryLabel.get(cat as string) || cat}
              </Badge>
            ))}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{settings.noProjects}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  {projectThumbnail(project) && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={projectThumbnail(project) || ''}
                        alt={pickLocalizedString(project.title as unknown, locale) || settings.projectImageAlt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-lg">
                        {pickLocalizedString(project.title as unknown, locale)}
                      </CardTitle>
                      {project.category && (
                        <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                          {categoryLabel.get(project.category) || project.category}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {pickLocalizedString(project.shortDescription as unknown, locale)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(projectTechnologies(project).length > 0 || project.status) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {project.status && (
                          <Badge
                            variant={
                              project.status === 'completed'
                                ? 'default'
                                : project.status === 'in-progress'
                                  ? 'outline'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {statusLabel.get(project.status.replace('-', '')) || project.status}
                          </Badge>
                        )}
                        {projectTechnologies(project)
                          .slice(0, 3)
                          .map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
