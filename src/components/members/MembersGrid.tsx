'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CommitteeEntry = {
  committee?: { id?: string; name?: string; slug?: string; badgeColor?: string; priority?: number } | string
  role?: string
}

type MemberData = {
  id: string
  firstName: string
  lastName: string
  username?: string | null
  memberId?: string | null
  bio?: string | null
  memberType?: string | null
  level?: number | null
  createdAt?: string | null
  committeeRoles?: CommitteeEntry[]
}

type CommitteeData = {
  id: string
  name: string
  slug: string
  badgeColor?: string
  priority?: number
}

type MembersGridProps = {
  members: MemberData[]
  avatarUrlMap: Record<string, string>
  committees: CommitteeData[]
}

function getCommitteeSlug(entry: CommitteeEntry): string {
  const c = entry.committee
  if (!c) return ''
  if (typeof c === 'string') return c
  return c.slug || ''
}

function getCommitteeName(entry: CommitteeEntry): string {
  const c = entry.committee
  if (!c) return 'Committee'
  if (typeof c === 'string') return c
  return c.name || 'Committee'
}

function hasCommittee(m: MemberData, slug: string): boolean {
  return (m.committeeRoles || []).some((cr) => getCommitteeSlug(cr) === slug)
}

function getCommitteePriority(entry: CommitteeEntry): number {
  const c = entry.committee
  if (!c || typeof c === 'string') return 100
  return c.priority ?? 100
}

function getRolePriority(m: MemberData): number {
  let best = 0
  for (const cr of m.committeeRoles || []) {
    const p = getCommitteePriority(cr)
    if (p > best) best = p
  }
  return best
}

function getBestCommitteePriority(m: MemberData, priorityMap: Map<string, number>): number {
  let best = 0
  for (const cr of m.committeeRoles || []) {
    const slug = getCommitteeSlug(cr)
    if (!slug) continue
    const p = priorityMap.get(slug)
    if (p !== undefined && p > best) best = p
  }
  return best
}

const BADGE_CLASSES: Record<string, string> = {
  amber: 'bg-cat-amber/15 text-cat-amber border-cat-amber/30',
  violet: 'bg-cat-violet/15 text-cat-violet border-cat-violet/30',
  sky: 'bg-cat-sky/15 text-cat-sky border-cat-sky/30',
  emerald: 'bg-cat-emerald/15 text-cat-emerald border-cat-emerald/30',
  blue: 'bg-cat-blue/15 text-cat-blue border-cat-blue/30',
  rose: 'bg-cat-rose/15 text-cat-rose border-cat-rose/30',
  orange: 'bg-cat-orange/15 text-cat-orange border-cat-orange/30',
  teal: 'bg-cat-teal/15 text-cat-teal border-cat-teal/30',
  slate: 'bg-cat-slate/15 text-muted-foreground border-cat-slate/30',
}

function getRoleBadges(m: MemberData) {
  const seen = new Set<string>()
  const badges: { label: string; className: string }[] = []
  for (const cr of m.committeeRoles || []) {
    const name = getCommitteeName(cr)
    const c = cr.committee
    const color = c && typeof c === 'object' ? c.badgeColor || 'slate' : 'slate'
    const className = BADGE_CLASSES[color] || BADGE_CLASSES.slate
    if (!seen.has(name)) {
      seen.add(name)
      badges.push({ label: name, className })
    }
    if (cr.role && !seen.has(cr.role)) {
      seen.add(cr.role)
      badges.push({ label: cr.role, className })
    }
  }
  return badges
}

export function MembersGrid({ members, avatarUrlMap, committees }: MembersGridProps) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  const toggleFilter = (slug: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const committeePriorityMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of committees) {
      map.set(c.slug, c.priority ?? 100)
    }
    return map
  }, [committees])

  const filtered = useMemo(() => {
    let result = [...members]

    // Text search
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.username?.toLowerCase().includes(q) ||
          m.memberId?.toLowerCase().includes(q) ||
          m.bio?.toLowerCase().includes(q),
      )
    }

    // Role filters (OR logic)
    if (activeFilters.size > 0) {
      result = result.filter((m) =>
        [...activeFilters].some((slug) => hasCommittee(m, slug)),
      )
    }

    // High-priority committee members first, then earliest joiner first
    result.sort((a, b) => {
      const pa = getBestCommitteePriority(a, committeePriorityMap)
      const pb = getBestCommitteePriority(b, committeePriorityMap)
      if (pa !== pb) return pb - pa
      return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    })

    return result
  }, [members, search, activeFilters, committees])

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {committees.map((committee) => {
            const active = activeFilters.has(committee.slug)
            return (
              <Button
                key={committee.slug}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter(committee.slug)}
              >
                {committee.name}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((member) => {
          const avatarUrl = avatarUrlMap[member.id]
          const profileSlug = member.username || member.memberId || ''
          const roleBadges = getRoleBadges(member)

          return (
            <Link key={member.id} href={`/profile/${profileSlug}`} className="group block">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02] group-active:scale-[0.98] active:shadow-lg active:shadow-primary/5 active:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
                      <AvatarImage
                        src={avatarUrl}
                        alt={`${member.firstName} ${member.lastName} profile picture`}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg font-semibold bg-linear-to-br from-primary/10 to-primary/5">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {member.firstName} {member.lastName}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        @{member.username || member.memberId}
                      </CardDescription>
                      {member.memberId && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {member.memberId}
                        </p>
                      )}
                      <div className="mt-1">
                        <Badge variant="secondary" className="capitalize">
                          {member.memberType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {roleBadges.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {roleBadges.map((rb) => (
                        <Badge key={rb.label} variant="outline" className={`text-xs ${rb.className}`}>
                          {rb.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      Level {member.level || 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {member.bio || "This member hasn't added a bio yet."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No members match your filters.</p>
        </div>
      )}
    </>
  )
}
