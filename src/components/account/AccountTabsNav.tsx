'use client'

import * as React from 'react'
import { useRef, useCallback } from 'react'
import {
  Award,
  BookOpen,
  Calendar,
  Settings,
  User,
  FileText,
  Megaphone,
  MessageSquare,
  Image,
} from 'lucide-react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { t, type Messages } from '@/messages'

export function AccountTabsNav({
  isOfficial,
  directoryApprovalStatus,
  messages,
}: {
  isOfficial?: boolean
  directoryApprovalStatus?: string
  messages: Messages
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current
    if (!container) return

    const isScrollable = container.scrollWidth > container.clientWidth
    if (!isScrollable) return

    e.preventDefault()
    e.stopPropagation()

    const delta = e.deltaY || e.deltaX
    container.scrollLeft += delta
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = scrollRef.current
    if (!container) return

    container.dataset.touchStartX = String(e.touches[0].clientX)
    container.dataset.touchStartScrollLeft = String(container.scrollLeft)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = scrollRef.current
    if (!container || !container.dataset.touchStartX) return

    const touchStartX = Number(container.dataset.touchStartX)
    const touchStartScrollLeft = Number(container.dataset.touchStartScrollLeft)
    const deltaX = touchStartX - e.touches[0].clientX

    container.scrollLeft = touchStartScrollLeft + deltaX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    delete container.dataset.touchStartX
    delete container.dataset.touchStartScrollLeft
  }, [])

  return (
    <div className="overflow-x-auto pb-1 coursor-pointer">
      <TabsList className="inline-flex min-w-max gap-2 px-1">
        <TabsTrigger
          value="overview"
          className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <User className="h-4 w-4" />
          {t(messages, 'profile.overview')}
        </TabsTrigger>
        <TabsTrigger
          value="profile"
          className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <Settings className="h-4 w-4" />
          {t(messages, 'profile.profileSettings')}
        </TabsTrigger>
        {isOfficial && (
          <TabsTrigger
            value="registration"
            className="inline-flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap"
          >
            <FileText className="h-4 w-4" />
            {t(messages, 'profile.registration')}
          </TabsTrigger>
        )}
        {/* <TabsTrigger
          value="courses"
          className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <BookOpen className="h-4 w-4" />
          {t(messages, 'profile.courses')}
        </TabsTrigger> */}
        <TabsTrigger
          value="enrollments"
          className="inline-flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <Calendar className="h-4 w-4" />
          {t(messages, 'profile.enrollments')}
        </TabsTrigger>
        <TabsTrigger
          value="announcements"
          className="inline-flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <Megaphone className="h-4 w-4" />
          {t(messages, 'profile.announcements')}
        </TabsTrigger>
        <TabsTrigger
          value="certificates"
          className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <Award className="h-4 w-4" />
          {t(messages, 'profile.certificates')}
        </TabsTrigger>
        <TabsTrigger
          value="complaints"
          className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap"
        >
          <MessageSquare className="h-4 w-4" />
          {t(messages, 'profile.complaints')}
        </TabsTrigger>
        {isOfficial && directoryApprovalStatus === 'approved' && (
          <TabsTrigger
            value="poster"
            className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap"
          >
            <Image className="h-4 w-4" />
            {t(messages, 'profile.poster')}
          </TabsTrigger>
        )}
      </TabsList>
    </div>
  )
}
