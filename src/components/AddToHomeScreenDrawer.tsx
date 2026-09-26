'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Smartphone, Download, X } from 'lucide-react'

const SESSION_KEY = 'a2hs_dismissed'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

export function AddToHomeScreenDrawer() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (isStandalone()) return
    if (sessionStorage.getItem(SESSION_KEY)) return

    const timer = setTimeout(() => setOpen(true), 3000)
    return () => clearTimeout(timer)
  }, [user, loading])

  const handleDismiss = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(SESSION_KEY, 'true')
    } catch {}
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleDismiss() }}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 p-0">
        <div className="relative flex flex-col gap-4 p-6 pb-8">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <SheetHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Install DPI Robotics Club</SheetTitle>
                <SheetDescription className="text-xs">
                  Add to your home screen for the best experience
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Install this app on your device for quick access, offline support, and a native-like experience.</p>
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1.5">
              <p className="font-medium text-foreground">How to install:</p>
              <p>1. Tap the <Download className="inline h-3.5 w-3.5 -mt-0.5" /> Share / Menu button in your browser</p>
              <p>2. Scroll and select &ldquo;Add to Home Screen&rdquo;</p>
              <p>3. Tap &ldquo;Add&rdquo; in the popup</p>
            </div>
          </div>

          <Button onClick={handleDismiss} variant="default" size="sm" className="w-full">
            Got it
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
