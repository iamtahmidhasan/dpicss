export type ProjectDoc = {
  id: string
  title?: string | Record<string, string>
  slug?: string
  shortDescription?: string | Record<string, string>
  description?: unknown
  thumbnail?: unknown
  gallery?: Array<{ image?: unknown; caption?: string | Record<string, string> }>
  videoUrl?: string | Record<string, string>
  category?: string
  technologies?: Array<{ name?: string | Record<string, string> }>
  features?: Array<{ feature?: string | Record<string, string> }>
  githubUrl?: string
  documentationUrl?: string
  demoUrl?: string
  teamMembers?: Array<{
    member?: unknown
    role?: string
  }>
  startDate?: string
  endDate?: string
  status?: string
  awards?: Array<{
    competition?: string | Record<string, string>
    position?: string | Record<string, string>
    year?: string
  }>
  featured?: boolean
  createdAt?: string
}

function getMediaUrl(media: unknown): string | null {
  if (!media || typeof media === 'string') return typeof media === 'string' ? media : null
  const obj = media as Record<string, unknown>
  const pluginGroup =
    'imagekit' in obj && obj.imagekit
      ? (obj.imagekit as Record<string, unknown>) ?? null
      : null
  const pluginUrl =
    pluginGroup && typeof pluginGroup.url === 'string'
      ? String(pluginGroup.url || '')
      : ''
  if (pluginUrl) return pluginUrl
  const pluginThumb =
    pluginGroup && typeof pluginGroup.thumbnailUrl === 'string'
      ? String(pluginGroup.thumbnailUrl || '')
      : ''
  return pluginThumb || null
}

export function projectThumbnail(project: ProjectDoc | undefined): string | null {
  return getMediaUrl(project?.thumbnail)
}

export function projectGallery(project: ProjectDoc | undefined): string[] {
  const gallery = project?.gallery
  if (!Array.isArray(gallery)) return []
  return gallery
    .map((item) => getMediaUrl(item?.image))
    .filter((url): url is string => Boolean(url))
}

export function projectTechnologies(project: ProjectDoc | undefined): string[] {
  const technologies = project?.technologies
  if (!Array.isArray(technologies)) return []
  return technologies
    .map((t) => t?.name)
    .filter((name): name is string => Boolean(typeof name === 'string' && name.trim()))
}

export function projectFeatures(project: ProjectDoc | undefined): string[] {
  const features = project?.features
  if (!Array.isArray(features)) return []
  return features
    .map((f) => f?.feature)
    .filter((feature): feature is string => Boolean(typeof feature === 'string' && feature.trim()))
}

export function projectTeam(project: ProjectDoc | undefined): Array<{
  id: string
  name: string
  role: string
  username?: string
  memberId?: string
  avatar?: unknown
  bio?: string
  memberType?: string
  level?: number
}> {
  const members = project?.teamMembers
  if (!Array.isArray(members)) return []

  return members
    .filter((m) => m?.member)
    .map((m) => {
      const member = m?.member
      const memberObj = typeof member === 'object' ? member as Record<string, unknown> : null
      const id = memberObj?.id ? String(memberObj.id) : undefined
      const firstName = memberObj?.firstName ? String(memberObj.firstName) : ''
      const lastName = memberObj?.lastName ? String(memberObj.lastName) : ''
      const name = firstName && lastName ? `${firstName} ${lastName}` : 'Unknown'
      return {
        id: id || '',
        name,
        role: m?.role || 'member',
        username: memberObj?.username ? String(memberObj.username) : undefined,
        memberId: memberObj?.memberId ? String(memberObj.memberId) : undefined,
        avatar: memberObj?.avatar,
        bio: memberObj?.bio ? String(memberObj.bio) : undefined,
        memberType: memberObj?.memberType ? String(memberObj.memberType) : undefined,
        level: memberObj?.level ? Number(memberObj.level) : undefined,
      }
    })
}

export function projectAwards(project: ProjectDoc | undefined): Array<{
  competition: string
  position?: string
  year?: string
}> {
  const awards = project?.awards
  if (!Array.isArray(awards)) return []

  return awards
    .filter((a) => a?.competition)
    .map((a) => ({
      competition: typeof a.competition === 'string' ? a.competition : '',
      position: typeof a.position === 'string' ? a.position : undefined,
      year: a.year,
    }))
}