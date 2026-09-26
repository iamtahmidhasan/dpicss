import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { BookOpen, Clock, Globe, ExternalLink, Trophy, ArrowLeft } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentUser } from '@/lib/payload-auth'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { ProjectsSettingsData } from '@/globals/types'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo-structured'
import { resolveMemberAvatarPublicUrl } from '@/lib/member-avatar-url'
import {
  projectThumbnail,
  projectGallery,
  projectTechnologies,
  projectFeatures,
  projectTeam,
  projectAwards,
  type ProjectDoc,
} from '@/lib/projects/project-helpers'
import type { Metadata } from 'next'

const keyedLookup = (items: Array<{ key: string; label: string }>) =>
  new Map(items.map((i) => [i.key, i.label]))

type PageProps = {
  params: Promise<{ slug: string }>
}

type ProjectMeta = {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  ogTitle?: string
  ogDescription?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
}

type ProjectDetail = ProjectDoc & {
  meta?: ProjectMeta
}

export async function generateMetadata({
  params,
}: {
  params: PageProps['params']
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const result = await payload.find({
    collection: 'projects' as any,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
    ...locOpts,
  })

  if (result.docs.length === 0) {
    return { title: 'Project Not Found | DPI Robotics Club' }
  }

  const project = result.docs[0] as ProjectDetail
  const title = pickLocalizedString(project.title, locale) || 'Project'
  const shortDesc = pickLocalizedString(project.shortDescription, locale)
  const thumbnailUrl = projectThumbnail(project)

  return {
    title: project.meta?.metaTitle || `${title} | DPI Robotics Club`,
    description: project.meta?.metaDescription || shortDesc || undefined,
    keywords: project.meta?.metaKeywords
      ? project.meta.metaKeywords.split(',').map((k) => k.trim())
      : undefined,
    openGraph: {
      title: project.meta?.ogTitle || title,
      description: project.meta?.ogDescription || shortDesc,
      images: thumbnailUrl ? [{ url: thumbnailUrl }] : undefined,
    },
    twitter: project.meta?.twitterCard
      ? {
          card: project.meta.twitterCard as 'summary' | 'summary_large_image',
          title: project.meta?.twitterTitle || title,
          description: project.meta?.twitterDescription || shortDesc,
          images: thumbnailUrl ? [thumbnailUrl] : undefined,
        }
      : undefined,
  }
}

export default async function ProjectSinglePage({ params }: PageProps) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const payload = await getPayloadWithRetry()
  const currentUser = await getCurrentUser()

  const settings = await getGlobalPayload<ProjectsSettingsData>('projects-settings', locale)
  const categoryLabel = keyedLookup(settings.categories || [])
  const statusLabel = keyedLookup(settings.status || [])
  const roleLabel = keyedLookup(settings.roles || [])

  const result = await (payload as any).find({
    collection: 'projects' as any,
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    user: currentUser ?? undefined,
    overrideAccess: false,
    ...locOpts,
  })

  const project = result.docs[0] as unknown as ProjectDetail | undefined
  if (!project) {
    notFound()
  }

  const title = pickLocalizedString(project.title, locale) || 'Untitled'
  const shortDesc = pickLocalizedString(project.shortDescription, locale)
  const thumbnailUrl = projectThumbnail(project)

  const projectSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: shortDesc || undefined,
    image: thumbnailUrl || undefined,
    datePublished: project.startDate || project.createdAt,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', name: 'Home', position: 1, '@id': '/' },
      { '@type': 'ListItem', name: 'Projects', position: 2, '@id': '/projects' },
      { '@type': 'ListItem', name: title, position: 3, '@id': `/projects/${slug}` },
    ],
  }

  const teamMembers = projectTeam(project)
  const teamAvatars = await Promise.all(
    teamMembers.map(async (member) => {
      const url = await resolveMemberAvatarPublicUrl(
        payload as any,
        member.avatar as string | { url?: string } | undefined | any,
        member.name,
      )
      return { id: member.id, url }
    }),
  )
  const avatarMap = new Map(teamAvatars.map((a) => [a.id, a.url]))

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <JsonLd data={[projectSchema, breadcrumbSchema]} />

      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {settings.all}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {thumbnailUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
            </div>
          )}

          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.category && (
                <Badge variant="secondary" className="capitalize">
                  {categoryLabel.get(project.category) || project.category}
                </Badge>
              )}
              <Badge
                variant={
                  project.status === 'completed'
                    ? 'default'
                    : project.status === 'in-progress'
                      ? 'outline'
                      : 'secondary'
                }
              >
                {statusLabel.get(project.status?.replace('-', '') || '') || project.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {shortDesc && <p className="mt-2 text-lg text-muted-foreground">{shortDesc}</p>}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">{settings.overview}</TabsTrigger>
              {projectGallery(project).length > 0 && (
                <TabsTrigger value="gallery">{settings.gallery}</TabsTrigger>
              )}
              {teamMembers.length > 0 && (
                <TabsTrigger value="team">{settings.team}</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {projectTechnologies(project).length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">{settings.technologies}</h3>
                  <div className="flex flex-wrap gap-2">
                    {projectTechnologies(project).map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {projectFeatures(project).length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">{settings.features}</h3>
                  <ul className="space-y-2">
                    {projectFeatures(project).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge
                          variant="secondary"
                          className="mt-0.5 size-5 shrink-0 p-0 text-center"
                        >
                          {i + 1}
                        </Badge>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {projectAwards(project).length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">{settings.awards}</h3>
                  <div className="space-y-2">
                    {projectAwards(project).map((award, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                        <Trophy className="size-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">{award.competition}</p>
                          {award.position && (
                            <p className="text-sm text-muted-foreground">
                              {award.position} {award.year && `(${award.year})`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {projectGallery(project).length > 0 && (
              <TabsContent value="gallery" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {projectGallery(project).map((img, i) => (
                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${title} gallery ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {teamMembers.length > 0 && (
              <TabsContent value="team" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                  {teamMembers.map((member) => {
                    const profileSlug = member.username || member.memberId || member.id || ''
                    const avatarUrl = avatarMap.get(member.id) || ''

                    return (
                      <Link
                        key={member.id}
                        href={`/profile/${profileSlug}`}
                        className="group block"
                      >
                        <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02]">
                          <CardHeader className="pb-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
                                <AvatarImage
                                  src={avatarUrl}
                                  alt={`${member.name} profile picture`}
                                  className="object-cover"
                                />
                                <AvatarFallback className="text-lg font-semibold bg-linear-to-br from-primary/10 to-primary/5">
                                  {member.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base font-semibold truncate">
                                  {member.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">@{profileSlug}</p>
                                <div className="mt-1">
                                  <Badge variant="secondary" className="capitalize text-xs">
                                    {roleLabel.get(member.role) || member.role}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between mb-2">
                              {member.memberType && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {member.memberType}
                                </Badge>
                              )}
                              {member.level && (
                                <Badge variant="outline" className="text-xs">
                                  Level {member.level}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {member.bio || settings.noBio}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="md:sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">{settings.detail}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(project.startDate || project.endDate) && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    {project.startDate &&
                      `${settings.startDate}: ${new Date(project.startDate).toLocaleDateString()}`}
                    {project.startDate && project.endDate && ' - '}
                    {project.endDate &&
                      `${settings.endDate}: ${new Date(project.endDate).toLocaleDateString()}`}
                  </span>
                </div>
              )}

              {(project.githubUrl || project.documentationUrl || project.demoUrl) && (
                <div className="space-y-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
                    >
                      <Globe className="size-4" />
                      {settings.github}
                      <ExternalLink className="ml-auto size-3" />
                    </a>
                  )}
                  {project.documentationUrl && (
                    <a
                      href={project.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
                    >
                      <BookOpen className="size-4" />
                      {settings.documentation}
                      <ExternalLink className="ml-auto size-3" />
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
                    >
                      <ExternalLink className="size-4" />
                      {settings.demo}
                      <ExternalLink className="ml-auto size-3" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
