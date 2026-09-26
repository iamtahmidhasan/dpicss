'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const queryToken = useMemo(() => params.get('token') || '', [params])
  const [tokenFromHash, setTokenFromHash] = useState('')

  useEffect(() => {
    const readHashToken = () => {
      const hash = window.location.hash || ''
      const raw = hash.startsWith('#') ? hash.slice(1) : hash
      const hashParams = new URLSearchParams(raw)
      setTokenFromHash(hashParams.get('token') || '')
    }

    readHashToken()
    window.addEventListener('hashchange', readHashToken)
    return () => window.removeEventListener('hashchange', readHashToken)
  }, [])

  const token = tokenFromHash || queryToken

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    let effectiveToken = token
    if (!effectiveToken) {
      const prompted = window.prompt('Enter the reset code from your email') || ''
      const normalized = prompted.trim()
      if (!normalized) {
        setError('Reset code is required. Please use the code sent to your email.')
        return
      }
      effectiveToken = normalized
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: effectiveToken,
          password,
          passwordConfirm: confirmPassword,
        }),
      })

      if (response.ok) {
        setMessage('Password updated successfully. Redirecting to login...')
        setTimeout(() => router.push('/login'), 1200)
      } else {
        const payload = await response.json().catch(() => null)
        setError(payload?.errors?.[0]?.message || payload?.error || 'Failed to reset password')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Field>
                {(message || error) && (
                  <Field>
                    <FieldDescription className={error ? 'text-red-600' : 'text-green-600'}>
                      {error || message}
                    </FieldDescription>
                  </Field>
                )}
                <Field>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        Updating...
                      </span>
                    ) : (
                      'Update password'
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-muted p-6">
          <Spinner />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
