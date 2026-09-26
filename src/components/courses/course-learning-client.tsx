'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { FileText, PlayCircle, ChevronRight, Lock, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { LessonRow, ModuleRow } from '@/lib/courses/course-helpers'
import { mediaUrl } from '@/lib/courses/course-helpers'

type Props = {
  courseSlug: string
  courseTitle: string
  enrollmentId: string
  modules: ModuleRow[]
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function PlyrVideoPlayer({ videoSrc, title }: { videoSrc: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [player, setPlayer] = useState<any>(null)

  const initPlayer = useCallback(async () => {
    if (!videoRef.current) return

    const Plyr = (await import('plyr')).default
    await import('plyr/dist/plyr.css')

    const plyrInstance = new Plyr(videoRef.current, {
      controls: ['play', 'progress', 'currentTime', 'mute', 'volume', 'fullscreen'],
    })

    const youtubeId = getYouTubeId(videoSrc)
    if (youtubeId) {
      plyrInstance.source = {
        type: 'video',
        sources: [{ src: youtubeId, provider: 'youtube' }],
      }
    }

    setPlayer(plyrInstance)
  }, [videoSrc])

  useEffect(() => {
    initPlayer()
    return () => {
      player?.destroy()
    }
  }, [initPlayer])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <video
        ref={videoRef}
        className="plyr-youtube plyr"
        playsInline
        data-poster={''}
      >
        <track kind="captions" />
      </video>
    </div>
  )
}

export { PlyrVideoPlayer }

export function CourseLearningClient({ courseSlug, courseTitle, enrollmentId, modules }: Props) {
  const [active, setActive] = useState<{ moduleId: string; lesson: LessonRow } | null>(() => {
    for (const mod of modules) {
      const mid = mod.id || ''
      for (const les of mod.lessons || []) {
        if (les.id) {
          return { moduleId: mid, lesson: les }
        }
      }
    }
    const firstMod = modules[0]
    const firstLes = firstMod?.lessons?.[0]
    if (firstMod?.id && firstLes) return { moduleId: firstMod.id, lesson: firstLes }
    return null
  })

  const videoSrc = useMemo(() => {
    if (!active?.lesson) return null
    const l = active.lesson
    if (l.type !== 'video') return null
    if (l.videoUrl) return l.videoUrl
    const file = l.videoFile
    const url = mediaUrl(file)
    return url
  }, [active])

  const documentUrl = useMemo(() => {
    if (!active?.lesson || active.lesson.type !== 'document') return null
    return mediaUrl(active.lesson.documentFile)
  }, [active])

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg font-semibold">
              {active?.lesson.title || 'Select a lesson'}
            </CardTitle>
            {active?.lesson.type ? (
              <Badge variant="secondary" className="capitalize">
                {active.lesson.type}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {active?.lesson.type === 'video' && videoSrc ? (
              <PlyrVideoPlayer videoSrc={videoSrc} title={active.lesson.title || 'Video'} />
            ) : null}

            {active?.lesson.type === 'video' && !videoSrc ? (
              <p className="text-sm text-muted-foreground">
                No video URL is configured for this lesson.
              </p>
            ) : null}

            {active?.lesson.type === 'document' && documentUrl ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="default">
                  <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                    Open document
                  </a>
                </Button>
                <span className="text-sm text-muted-foreground">Opens in a new tab</span>
              </div>
            ) : null}

            {active?.lesson.type === 'document' && !documentUrl && active.lesson.description ? (
              <p className="text-sm text-muted-foreground">{active.lesson.description}</p>
            ) : null}

            {active?.lesson.type === 'live' && (
              <div className="space-y-4">
                {active.lesson.googleMeetLink ? (
                  <Button asChild className="w-full">
                    <a 
                      href={active.lesson.googleMeetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      🔴 Join Live Session
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No Google Meet link configured for this session.
                  </p>
                )}
                {active.lesson.scheduledAt && (
                  <div className="text-sm text-muted-foreground">
                    <p>📅 Scheduled: {new Date(active.lesson.scheduledAt).toLocaleString()}</p>
                    {active.lesson.duration && <p>⏱️ Duration: {active.lesson.duration}</p>}
                  </div>
                )}
                {active.lesson.description && (
                  <p className="text-sm text-muted-foreground">{active.lesson.description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Accordion
          type="multiple"
          className="w-full rounded-lg border"
          defaultValue={modules.map((m) => m.id || '')}
        >
          {modules.map((mod) => (
            <AccordionItem value={mod.id || mod.title || 'module'} key={mod.id || mod.title}>
              <AccordionTrigger className="px-4 text-left text-sm font-medium hover:no-underline">
                <span className="flex items-center gap-2">
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  {mod.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <ul className="space-y-1">
                  {(mod.lessons || [])
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((lesson) => {
                      const lid = lesson.id || ''
                      const isActive =
                        active != null &&
                        active.lesson.id === lesson.id &&
                        active.moduleId === (mod.id || '')
                      return (
                        <li key={lid || lesson.title}>
                          <button
                            type="button"
                            onClick={() =>
                              setActive({
                                moduleId: mod.id || '',
                                lesson,
                              })
                            }
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                              isActive ? 'bg-muted font-medium' : ''
                            }`}
                          >
                            {lesson.type === 'video' ? (
                              <PlayCircle className="size-4 shrink-0 text-primary" />
                            ) : (
                              <FileText className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                          </button>
                        </li>
                      )
                    })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button variant="outline" className="w-full" asChild>
          <a href={`/courses/${courseSlug}`}>Course overview</a>
        </Button>
      </div>
    </div>
  )
}

export function CourseCurriculumLocked({
  modules,
  showPreviewContent,
  previewLesson,
}: {
  modules: ModuleRow[]
  showPreviewContent: boolean
  previewLesson: { moduleId: string; lesson: LessonRow } | null
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {showPreviewContent && previewLesson ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Free preview</Badge>
                <CardTitle className="text-lg">{previewLesson.lesson.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {previewLesson.lesson.type === 'video' && previewLesson.lesson.videoUrl ? (
                <PlyrVideoPlayer videoSrc={previewLesson.lesson.videoUrl} title={previewLesson.lesson.title || 'Preview'} />
              ) : (
                <p>This preview does not have playable media configured.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Lock className="size-10 text-muted-foreground" />
              <p className="font-medium">Lesson content is locked</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Enroll via WhatsApp to get access. After payment is confirmed, an administrator will
                activate your enrollment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <div>
        <Accordion
          type="multiple"
          className="w-full rounded-lg border"
          defaultValue={modules.map((m) => m.id || '')}
        >
          {modules.map((mod) => (
            <AccordionItem value={mod.id || mod.title || 'm'} key={mod.id || mod.title}>
              <AccordionTrigger className="px-4 text-left text-sm font-medium hover:no-underline">
                <span className="flex items-center gap-2">
                  <Lock className="size-4 text-muted-foreground" />
                  {mod.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <ul className="space-y-1">
                  {(mod.lessons || [])
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((lesson) => (
                      <li
                        key={lesson.id || lesson.title}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground"
                      >
                        {lesson.type === 'video' ? (
                          <PlayCircle className="size-4 shrink-0" />
                        ) : lesson.type === 'live' ? (
                          <Video className="size-4 shrink-0 text-red-500" />
                        ) : (
                          <FileText className="size-4 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        <Lock className="size-3 shrink-0" />
                      </li>
                    ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
