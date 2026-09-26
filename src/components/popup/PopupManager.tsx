'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface DisplaySettings {
  showCloseButton: boolean
  closeOnOverlayClick: boolean
  showOncePerSession: boolean
  animation: string
}

interface PopupLink {
  enabled: boolean
  url: string
  openInNewTab: boolean
}

interface PopupData {
  id: string
  imageMobileUrl: string
  imageMobileAlt: string
  imageDesktopUrl: string
  imageDesktopAlt: string
  link: PopupLink
  displaySettings: DisplaySettings
}

function getAnimationClass(animation: string): string {
  switch (animation) {
    case 'slide-up':
      return 'animate-in slide-in-from-bottom-4'
    case 'slide-down':
      return 'animate-in slide-in-from-top-4'
    case 'scale':
      return 'animate-in zoom-in-95'
    default:
      return 'animate-in fade-in-0'
  }
}

export function PopupManager() {
  const [popups, setPopups] = useState<PopupData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAndShowPopup = useCallback(async () => {
    if (typeof window === 'undefined') return

    try {
      const userStr = localStorage.getItem('payload-user')
      let userHeader = ''
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          userHeader = JSON.stringify({ roles: user.roles || [] })
        } catch {
          // ignore
        }
      }

      const currentPath = window.location.pathname
      const htmlLang = document.documentElement.lang || 'en'

      const response = await fetch(
        `/api/public-popups?path=${encodeURIComponent(currentPath)}&locale=${htmlLang}`,
        {
          headers: {
            ...(userHeader ? { 'x-user': userHeader } : {}),
            'x-locale': htmlLang,
          },
        },
      )

      if (!response.ok) return

      const data = await response.json()
      const rawPopups = data.popups || []

      let dismissed: string[] = []
      try {
        dismissed = JSON.parse(sessionStorage.getItem('dismissed-popups') || '[]')
      } catch {
        // ignore
      }

      const availablePopups = rawPopups.filter((p: PopupData) => !dismissed.includes(p.id))

      setPopups(availablePopups)

      if (availablePopups.length > 0) {
        setCurrentIndex(0)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('[PopupManager] Error fetching popups:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAndShowPopup()
  }, [checkAndShowPopup])

  const handleClose = useCallback(() => {
    setIsOpen(false)

    if (!popups[currentIndex]) return

    const currentId = popups[currentIndex].id
    const displaySettings = popups[currentIndex].displaySettings

    if (displaySettings.showOncePerSession) {
      try {
        const dismissed = JSON.parse(sessionStorage.getItem('dismissed-popups') || '[]')
        if (!dismissed.includes(currentId)) {
          dismissed.push(currentId)
          sessionStorage.setItem('dismissed-popups', JSON.stringify(dismissed))
        }
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      if (currentIndex < popups.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsOpen(true)
      }
    }, 300)
  }, [popups, currentIndex])

  const currentPopup = useMemo(() => {
    return popups[currentIndex] || null
  }, [popups, currentIndex])

  const handleLinkClick = useCallback(() => {
    if (!currentPopup) return
    const { id, displaySettings } = currentPopup
    if (displaySettings.showOncePerSession) {
      try {
        const dismissed = JSON.parse(sessionStorage.getItem('dismissed-popups') || '[]')
        if (!dismissed.includes(id)) {
          dismissed.push(id)
          sessionStorage.setItem('dismissed-popups', JSON.stringify(dismissed))
        }
      } catch {
        // ignore
      }
    }
    setIsOpen(false)
  }, [currentPopup])

  if (isLoading) return null
  if (popups.length === 0) return null
  if (!currentPopup) return null

  const animation = getAnimationClass(currentPopup.displaySettings.animation)
  const showClose = currentPopup.displaySettings.showCloseButton
  const link = currentPopup.link
  const hasLink = link.enabled && link.url

  const imageContent = (
    <>
      <Image
        src={currentPopup.imageDesktopUrl}
        alt={currentPopup.imageDesktopAlt || 'Popup'}
        width={1000}
        height={600}
        className="hidden sm:block w-full h-auto"
      />
      <Image
        src={currentPopup.imageMobileUrl}
        alt={currentPopup.imageMobileAlt || 'Popup'}
        width={500}
        height={400}
        className="block sm:hidden w-full h-auto"
      />
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={`w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] w-[90vw] p-0 border-0 gap-0 bg-transparent shadow-none ${animation}`}
        hideCloseButton
        onPointerDownOutside={(e) => {
          if (!currentPopup.displaySettings.closeOnOverlayClick) {
            e.preventDefault()
          }
        }}
      >
        <div className="relative leading-[0]">
          {hasLink ? (
            <Link
              href={link.url}
              target={link.openInNewTab ? '_blank' : '_self'}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              onClick={handleLinkClick}
            >
              {imageContent}
            </Link>
          ) : (
            imageContent
          )}

          {showClose && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-2 right-2 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
