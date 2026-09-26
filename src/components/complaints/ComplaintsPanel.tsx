'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CSRF_COOKIE = 'dpirc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

type ComplaintItem = {
  id?: string
  message?: string
  status?: string
  createdAt?: string
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

function formatDate(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString()
}

export function ComplaintsPanel({
  complaints,
  canSubmit,
  memberId,
  memberType,
}: {
  complaints: ComplaintItem[]
  canSubmit: boolean
  memberId?: string
  memberType?: 'official' | 'unofficial'
}) {
  const [items, setItems] = useState<ComplaintItem[]>(complaints)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [items])

  useEffect(() => {
    setItems(complaints)
  }, [complaints])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const trimmed = message.trim()
    if (trimmed.length < 10) {
      setError('Please enter at least 10 characters.')
      return
    }
    if (trimmed.length > 2000) {
      setError('Please keep complaints under 2000 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/complaints', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          memberId: memberId || '',
          memberType: memberType || 'official',
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Failed to submit complaint')
        return
      }

      const newComplaint = payload?.complaint as ComplaintItem | undefined
      if (newComplaint?.message) {
        setItems((prev) => [newComplaint, ...prev])
      }
      setMessage('')
      setSuccess('Complaint added. The member has been emailed.')
    } catch {
      setError('Something went wrong while submitting')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Complaints
        </CardTitle>
        <CardDescription>
          Share issues or concerns. Your complaint will be reviewed by the DPIRC team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {canSubmit && memberId ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="complaintMessage">Complaint message</Label>
              <Textarea
                id="complaintMessage"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe the issue you want to report..."
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">Max 2000 characters.</p>
            </div>

            {(error || success) && (
              <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error || success}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="inline-flex gap-2">
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Complaint
                </>
              )}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Only admins can add complaints.</p>
        )}

        <div className="space-y-3">
          {sortedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complaints submitted yet.</p>
          ) : (
            sortedItems.map((complaint, index) => (
              <div key={complaint.id || index} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {complaint.status ? (
                    <Badge variant="outline" className="capitalize">
                      {complaint.status.replace(/_/g, ' ')}
                    </Badge>
                  ) : null}
                  {complaint.createdAt ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(complaint.createdAt)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                  {complaint.message || 'No message provided.'}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
