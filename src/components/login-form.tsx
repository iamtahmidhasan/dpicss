'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { GoogleButton } from '@/components/google-button'
import { CSRF_COOKIE_NAME } from '@/lib/payload-auth-utils'
import Link from 'next/link'

const CSRF_HEADER = 'x-csrf-token'

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
  const fromCookie = readCookie(CSRF_COOKIE_NAME)
  if (fromCookie) return fromCookie
  try {
    const res = await fetch('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
    const fromHeader = res.headers.get(CSRF_HEADER) || ''
    if (fromHeader) return fromHeader
  } catch { /* ignore */ }
  return readCookie(CSRF_COOKIE_NAME)
}

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [csrfToken, setCsrfToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getCsrfToken().then(setCsrfToken)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlError = params.get('error')
      if (urlError) {
        if (urlError === 'no_account') {
          setError('No account found with this Google email. Please register first.')
        } else if (urlError === 'email_account') {
          setError('This account uses email and password. Please sign in with your password.')
        } else if (urlError === 'google_failed') {
          setError('Google sign-in failed. Please try again.')
        } else if (urlError === 'user_not_found') {
          setError('No account found with this email. Please register first.')
        } else if (urlError === 'google_auth_failed') {
          setError('Google authentication failed. Please try again.')
        } else if (urlError === 'token_exchange_failed') {
          setError('Failed to complete Google login. Please try again.')
        } else if (urlError === 'auth_failed') {
          setError('Authentication failed. Please try again.')
        } else {
          setError('An error occurred. Please try again.')
        }
        window.history.replaceState({}, '', '/login')
      }
    }
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const csrf = await getCsrfToken()

    try {
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(csrf ? { [CSRF_HEADER]: csrf } : {}),
        },
        body: JSON.stringify({ email, otp }),
      })

      const verifyPayload = await verifyResponse.json().catch(() => null)

      if (verifyResponse.ok) {
        // Try to login after verification
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (loginResponse.ok) {
          window.location.href = '/account'
        } else {
          const loginPayload = await loginResponse.json().catch(() => null)
          if (loginPayload?.error?.includes('expired') || loginPayload?.error?.includes('OTP')) {
            // OTP expired during verification, user was cleaned up
            setNeedsVerification(false)
            setError('Verification expired. Please register again.')
          } else {
            setNeedsVerification(false)
            setMessage('Verification successful. Please login.')
          }
        }
      } else {
        if (verifyPayload?.error?.includes('expired')) {
          // OTP expired, clean up user
          setNeedsVerification(false)
          setError('Verification expired. Please register again.')
        } else {
          setError(verifyPayload?.error || 'Verification failed')
        }
      }
    } catch (err) {
      console.error('Verify error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setMessage('')
    setIsResending(true)

    const csrf = await getCsrfToken()

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(csrf ? { [CSRF_HEADER]: csrf } : {}),
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok) {
        setMessage(data?.message || 'A new OTP has been sent to your email.')
      } else {
        // If resend fails, user might have been cleaned up
        if (data?.error?.includes('not found') || data?.error?.includes('not exist')) {
          setNeedsVerification(false)
          setError('Account not found. Please register again.')
        } else {
          setError(data?.error || 'Failed to resend OTP')
        }
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend OTP')
    } finally {
      setIsResending(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        window.location.href = '/account'
      } else {
        const payload = await response.json().catch(() => null)
        
        // Check for various unverified states
        const errorMsg = payload?.error || ''
        const needsVerify =
          errorMsg.includes('verify') ||
          errorMsg.includes('verified') ||
          errorMsg.includes('OTP') ||
          errorMsg.includes('unverified')

        if (needsVerify) {
          setNeedsVerification(true)
        } else {
          setError(payload?.error || 'Login failed')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError('')

    try {
      const csrf = await getCsrfToken()
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { [CSRF_HEADER]: csrf } : {}),
        },
        body: JSON.stringify({
          flowType: 'login',
        }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok && data?.url) {
        window.location.href = data.url
      } else {
        setError(data?.error || 'Failed to start Google authentication')
      }
    } catch (err) {
      console.error('Google login error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Show verification card if user needs to verify
  if (needsVerification) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit OTP sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="otp">Verification code (OTP)</FieldLabel>
                  <InputOTP
                    id="otp"
                    maxLength={6}
                    pattern={'^\\d+$'}
                    value={otp}
                    onChange={(value) => setOtp(value.replace(/\D/g, ''))}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendOTP}
                    disabled={isResending || isLoading}
                    className="w-full"
                  >
                    {isResending ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        Resending...
                      </span>
                    ) : (
                      'Resend OTP'
                    )}
                  </Button>
                </Field>
                {(error || message) && (
                  <Field>
                    <FieldDescription className={error ? 'text-red-600' : 'text-green-600'}>
                      {error || message}
                    </FieldDescription>
                  </Field>
                )}
                <Field>
                  <Button type="submit" disabled={isLoading || otp.length !== 6}>
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        Verifying...
                      </span>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </Field>
                <Field>
                  <FieldDescription className="text-center">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {
                        setNeedsVerification(false)
                        setError('')
                        setMessage('')
                      }}
                    >
                      Back to login
                    </button>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <GoogleButton
                  onClick={handleGoogleLogin}
                  isLoading={isGoogleLoading}
                  label="Continue with Google"
                  variant="outline"
                />
              </Field>
              <Field>
                <div className="relative flex items-center justify-center py-2">
                  <div className="flex-grow border-t border-border" />
                  <span className="mx-4 text-xs text-muted-foreground">or</span>
                  <div className="flex-grow border-t border-border" />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setNeedsVerification(false)
                  }}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      Signing in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </Button>
                {error && (
                  <FieldDescription className="text-center text-red-600">{error}</FieldDescription>
                )}
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/register">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <Link href="#">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}