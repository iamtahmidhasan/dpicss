'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { RichTextRenderer } from '@/components/RichTextRenderer'

const CSRF_COOKIE = 'dpirc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

type Announcement = {
  id: string
  title?: string
  summary?: string
  content?: unknown
  publishedAt?: string
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const encodedName = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(encodedName)) {
      return decodeURIComponent(trimmed.slice(encodedName.length))
    }
  }
  return ''
}

async function getCsrfToken(): Promise<string> {
  const fromCookie = readCookie(CSRF_COOKIE)
  if (fromCookie) return fromCookie
  try {
    const res = await fetch('/api/users/me', { method: 'GET', credentials: 'include' })
    const fromHeader = res.headers.get(CSRF_HEADER) || ''
    if (fromHeader) return fromHeader
  } catch {
    // Ignore
  }
  return readCookie(CSRF_COOKIE)
}

export function AnnouncementsTab({
  announcements,
  readAnnouncementIds,
}: {
  announcements: Announcement[]
  readAnnouncementIds: string[]
}) {
  const searchParams = useSearchParams()
  const [openId, setOpenId] = useState<string | null>(null)
  const [readIds, setReadIds] = useState(() => new Set(readAnnouncementIds))

  const announcementById = useMemo(() => {
    return new Map(announcements.map((announcement) => [announcement.id, announcement]))
  }, [announcements])

  useEffect(() => {
    const requested = searchParams.get('announcement')
    if (requested && requested !== openId) {
      setOpenId(requested)
    }
  }, [openId, searchParams])

  useEffect(() => {
    if (!openId) return
    if (readIds.has(openId)) return

    let active = true

    const markRead = async () => {
      try {
        const csrfToken = await getCsrfToken()
        const response = await fetch('/api/announcements/read', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
          },
          body: JSON.stringify({ announcementId: openId }),
        })

        if (!response.ok) return

        if (active) {
          setReadIds((prev) => {
            const next = new Set(prev)
            next.add(openId)
            return next
          })
        }
      } catch {
        // Ignore
      }
    }

    markRead()

    return () => {
      active = false
    }
  }, [openId, readIds])

  const activeAnnouncement = openId ? announcementById.get(openId) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Latest updates from DPICS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          announcements.map((announcement, idx) => {
            const isUnread = !readIds.has(announcement.id)
            return (
              <div key={announcement.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {announcement.title || 'Announcement'}
                    </p>
                    {announcement.summary ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {announcement.summary}
                      </p>
                    ) : null}
                    {announcement.publishedAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(announcement.publishedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnread ? <Badge variant="secondary">Unread</Badge> : null}
                    <Button size="sm" variant="outline" onClick={() => setOpenId(announcement.id)}>
                      Open
                    </Button>
                  </div>
                </div>

                {idx < announcements.length - 1 ? <Separator className="mt-4" /> : null}
              </div>
            )
          })
        )}
      </CardContent>

      <Sheet open={Boolean(openId)} onOpenChange={(open) => (!open ? setOpenId(null) : null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{activeAnnouncement?.title || 'Announcement'}</SheetTitle>
            <SheetDescription>
              {activeAnnouncement?.publishedAt
                ? new Date(activeAnnouncement.publishedAt).toLocaleString()
                : 'Announcement details'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {activeAnnouncement?.summary ? (
              <p className="text-sm text-muted-foreground">{activeAnnouncement.summary}</p>
            ) : null}
            {activeAnnouncement?.content ? (
              <RichTextRenderer data={activeAnnouncement.content} />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}
