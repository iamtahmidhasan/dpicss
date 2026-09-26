'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Loader2 } from 'lucide-react'

type MemberPosterProps = {
  memberId?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  memberType?: string
  clubLogoUrl?: string
  clubName?: string
  directoryApprovalStatus?: string
}

export function MemberPoster({
  memberId,
  firstName,
  lastName,
  avatarUrl,
  directoryApprovalStatus,
}: MemberPosterProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'downloading'>('idle')
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const posterRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (posterRef.current) URL.revokeObjectURL(posterRef.current)
    }
  }, [])

  if (directoryApprovalStatus !== 'approved') return null

  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Member'

  const generate = useCallback(async (): Promise<string | null> => {
    try {
      const resp = await fetch('/api/member-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          firstName,
          lastName,
          avatarUrl: avatarUrl || null,
        }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.error || `Server error (${resp.status})`)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      posterRef.current = url
      return url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate poster'
      setError(message)
      return null
    }
  }, [memberId, firstName, lastName, avatarUrl])

  const handleGenerate = async () => {
    setState('loading')
    setError(null)
    const url = await generate()
    if (url) {
      setPosterUrl(url)
      setState('ready')
    } else {
      setState('idle')
    }
  }

  const handleDownload = async () => {
    if (!posterUrl) {
      await handleGenerate()
      if (!posterRef.current) return
    }
    setState('downloading')
    const url = posterRef.current
    if (url) {
      const link = document.createElement('a')
      link.download = `dpirc-${memberId || 'poster'}.png`
      link.href = url
      link.click()
    }
    setState('ready')
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-4 px-4 sm:p-6">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${name} member poster`}
            className="w-full max-w-[400px] h-auto rounded-lg shadow-md"
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-lg bg-muted/30"
            style={{ width: 500, height: 500 }}
          >
            {state === 'loading' ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Generating poster...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive text-center px-6">
                <span className="text-sm font-medium">Generation failed</span>
                <span className="text-xs">{error}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center px-4">
                Generate your official DPIRC member poster
              </p>
            )}
          </div>
        )}

        <Button
          onClick={state === 'ready' ? handleDownload : handleGenerate}
          disabled={state === 'loading' || state === 'downloading'}
          className="w-full sm:w-auto"
        >
          {state === 'loading' || state === 'downloading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {state === 'loading' ? 'Generating...' : 'Downloading...'}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {state === 'ready' ? 'Download Poster' : 'Generate Poster'}
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
