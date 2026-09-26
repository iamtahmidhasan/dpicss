'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

type VerifyResult =
  | {
      valid: true
      certificateId?: string
      recipientName?: string
      memberId?: string
      memberType?: string
      email?: string
      courseTitle?: string
      certificateImageUrl?: string
    }
  | { valid: false; error?: string }

export default function VerifyCertificatePage() {
  const [serial, setSerial] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = serial.trim()
    if (!code) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/verify-certificate/${encodeURIComponent(code)}`)
      const data = await res.json()
      setResult(data as VerifyResult)
    } catch {
      setResult({ valid: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <CardTitle>Verify certificate</CardTitle>
          </div>
          <CardDescription>
            Enter the certificate ID printed on the certificate (for example DPI-2026-XXXXXXXX).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serial">Certificate ID</Label>
              <Input
                id="serial"
                name="serial"
                placeholder="DPI-2026-…"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !serial.trim()}>
              {loading ? (
                <>
                  <Spinner />
                  Checking…
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </form>

          {result ? (
            <div
              className={`mt-6 rounded-lg border p-4 text-sm ${
                result.valid
                  ? 'border-success-border bg-success-soft text-success-foreground dark:border-success-foreground dark:bg-success-soft dark:text-success-muted'
                  : 'border-destructive/30 bg-destructive/5'
              }`}
            >
              {result.valid ? (
                <ul className="space-y-1">
                  <li>
                    <span className="font-medium">Status:</span> Valid
                  </li>
                  {result.certificateId ? (
                    <li>
                      <span className="font-medium">Certificate ID:</span> {result.certificateId}
                    </li>
                  ) : null}
                  {result.recipientName ? (
                    <li>
                      <span className="font-medium">Recipient:</span> {result.recipientName}
                    </li>
                  ) : null}
                  {result.memberId ? (
                    <li>
                      <span className="font-medium">Member ID:</span> {result.memberId}
                    </li>
                  ) : null}
                  {result.memberType ? (
                    <li>
                      <span className="font-medium">Member type:</span> {result.memberType}
                    </li>
                  ) : null}
                  {result.email ? (
                    <li>
                      <span className="font-medium">Email:</span> {result.email}
                    </li>
                  ) : null}
                  {result.courseTitle ? (
                    <li>
                      <span className="font-medium">Course:</span> {result.courseTitle}
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p>{result.error || 'Certificate could not be verified.'}</p>
              )}
              {result.valid && result.certificateImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.certificateImageUrl}
                  alt="Certificate"
                  className="mt-4 w-full rounded-lg border object-contain"
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
