'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { OfficialMemberRegistrationForm } from '@/components/OfficialMemberRegistrationForm'
import { GoogleButton } from '@/components/google-button'
import { CSRF_COOKIE_NAME } from '@/lib/payload-auth-utils'
import { useRegistrationSettings } from '@/components/RegistrationSettingsProvider'

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
  } catch {
    // Ignore and fallback to cookie read after probe.
  }

  return readCookie(CSRF_COOKIE_NAME)
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const MIN_PASSWORD_LENGTH = 8
  const { allowOfficialRegistration, allowUnofficialRegistration } = useRegistrationSettings()

  const availableMemberTypes = (
    [
      ['official', allowOfficialRegistration] as const,
      ['unofficial', allowUnofficialRegistration] as const,
    ] as const
  )
    .filter(([, allowed]) => allowed)
    .map(([type]) => type)

  const singleMemberType = availableMemberTypes.length === 1 ? availableMemberTypes[0] : null

  useEffect(() => {
    const googleSuccess = searchParams.get('google')
    const stepParam = searchParams.get('step')
    const errorParam = searchParams.get('error')

    if (googleSuccess === 'success' && stepParam === 'username') {
      setStep('username')
      setMessage('Google account verified. Choose a username for your profile.')
      window.history.replaceState(null, '', '/register')
    }

    if (googleSuccess === 'success' && stepParam === 'official-details') {
      setStep('official-details')
      setMessage('Google account verified. Please complete your profile.')
      window.history.replaceState(null, '', '/register')
    }

    if (errorParam) {
      if (errorParam === 'email_account') {
        setError('An account with this email already exists. Please sign in with your password.')
      } else if (errorParam === 'pending_verification') {
        setError('This email has a pending registration. Please complete OTP verification.')
      } else if (errorParam === 'invalid_callback') {
        setError('Invalid callback. Please try again.')
      } else if (errorParam === 'invalid_state') {
        setError('Session expired. Please try again.')
      }
      window.history.replaceState(null, '', '/register')
    }
  }, [searchParams])
  const [formData, setFormData] = useState({
    memberIntent: (singleMemberType ?? '') as '' | 'official' | 'unofficial',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    department: '',
  })
  const [otp, setOTP] = useState('')
  const [step, setStep] = useState<'signup' | 'verify' | 'username' | 'official-details'>('signup')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isUsernameLoading, setIsUsernameLoading] = useState(false)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!formData.memberIntent) {
      setError('Please select a registration type')
      return
    }

    if (!isValidEmail(formData.email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setIsLoading(true)

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          memberIntent: formData.memberIntent,
          institutionName: formData.institutionName,
          department: formData.department,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (response.ok) {
        setStep('verify')
        setMessage(payload?.message || 'OTP sent to your email. Enter it to verify your account.')
      } else {
        setError(payload?.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      })

      const verifyPayload = await response.json().catch(() => null)

      if (response.ok) {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        if (loginResponse.ok) {
          // For official members, show the registration form
          if (formData.memberIntent === 'official') {
            setMessage(verifyPayload?.message || 'Account verified. Complete your profile...')
            setStep('official-details')
          } else {
            // For unofficial members, redirect immediately
            setMessage(verifyPayload?.message || 'Account verified. Redirecting...')
            setTimeout(() => {
              const slug = verifyPayload?.profileUsername as string | undefined
              if (slug) {
                router.push(`/profile/${encodeURIComponent(slug)}`)
              } else {
                router.push('/account')
              }
            }, 800)
          }
        } else {
          setMessage(verifyPayload?.message || 'Account verified. Redirecting to login...')
          setTimeout(() => {
            router.push('/login')
          }, 1000)
        }
      } else {
        setError(verifyPayload?.error || 'OTP verification failed')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setMessage('')
    setIsResending(true)

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (response.ok) {
        setMessage(payload?.message || 'A new OTP has been sent to your email.')
      } else {
        setError(payload?.error || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!formData.memberIntent) {
      setError('Please select a registration type')
      return
    }

    setIsGoogleLoading(true)
    setError('')

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({
          memberIntent: formData.memberIntent,
          flowType: 'register',
          institutionName: formData.institutionName,
          department: formData.department,
        }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok && data?.url) {
        window.location.href = data.url
      } else {
        setError(data?.error || 'Failed to start Google authentication')
      }
    } catch (error) {
      console.error('Google auth error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError('')
    setIsUsernameLoading(true)

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/auth/username', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({ username: usernameValue }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok) {
        setStep('official-details')
        setMessage('Profile created. Please complete your registration details.')
      } else {
        setUsernameError(data?.error || 'Failed to set username')
      }
    } catch (error) {
      console.error('Username submission error:', error)
      setUsernameError('Something went wrong. Please try again.')
    } finally {
      setIsUsernameLoading(false)
    }
  }

  if (availableMemberTypes.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Registration Unavailable</h1>
          <p className="text-muted-foreground">
            Registration is not available at this time. Please contact the administrator for
            assistance.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      {step === 'official-details' ? (
        <OfficialMemberRegistrationForm />
      ) : step === 'username' ? (
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="m9 12 2 2 4-4" />
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
                <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3" />
              </svg>
            </div>
            DPI Robotics Club
          </a>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Choose your username</CardTitle>
              <CardDescription>This will be your public profile URL</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="newUsername">Username</FieldLabel>
                    <Input
                      id="newUsername"
                      name="newUsername"
                      placeholder="tahmid"
                      value={usernameValue}
                      onChange={(e) => setUsernameValue(e.target.value)}
                      required
                    />
                  </Field>
                  {usernameError && (
                    <Field>
                      <FieldDescription className="text-red-600">{usernameError}</FieldDescription>
                    </Field>
                  )}
                  <Field>
                    <Button type="submit" disabled={isUsernameLoading}>
                      {isUsernameLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner />
                          Saving...
                        </span>
                      ) : (
                        'Set Username'
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By continuing, you agree to our <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="m9 12 2 2 4-4" />
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
                <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3" />
              </svg>
            </div>
            DPI Robotics Club
          </a>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {step === 'signup' ? 'Create an account' : 'Verify your email'}
              </CardTitle>
              <CardDescription>
                {step === 'signup'
                  ? 'Continue with email to create your account'
                  : `Enter the 6-digit OTP sent to ${formData.email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step === 'signup' ? handleSubmit : handleVerifyOTP}>
                <FieldGroup>
                  {step === 'signup' ? (
                    <>
                      {availableMemberTypes.length > 1 && (
                        <Field>
                          <FieldLabel>Are you an official member of DPIRC?</FieldLabel>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={formData.memberIntent === 'official' ? 'default' : 'outline'}
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, memberIntent: 'official' }))
                              }
                            >
                              Yes, official
                            </Button>
                            <Button
                              type="button"
                              variant={
                                formData.memberIntent === 'unofficial' ? 'default' : 'outline'
                              }
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, memberIntent: 'unofficial' }))
                              }
                            >
                              No, unofficial
                            </Button>
                          </div>
                        </Field>
                      )}
                      {formData.memberIntent && (
                        <Field>
                          <GoogleButton
                            onClick={handleGoogleAuth}
                            isLoading={isGoogleLoading}
                            label="Sign up with Google"
                          />
                          <div className="relative flex items-center justify-center py-2">
                            <div className="flex-grow border-t border-border" />
                            <span className="mx-4 text-xs text-muted-foreground">or</span>
                            <div className="flex-grow border-t border-border" />
                          </div>
                        </Field>
                      )}
                      <Field>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                            <Input
                              id="firstName"
                              name="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                            <Input
                              id="lastName"
                              name="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="m@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      {formData.memberIntent === 'official' && (
                        <>
                          <Field>
                            <FieldLabel htmlFor="username">Username</FieldLabel>
                            <Input
                              id="username"
                              name="username"
                              placeholder="tahmid"
                              value={formData.username}
                              onChange={handleChange}
                              required={formData.memberIntent === 'official'}
                            />
                          </Field>
                        </>
                      )}
                      {formData.memberIntent === 'unofficial' && (
                        <>
                          <Field>
                            <FieldLabel htmlFor="institutionName">
                              Institution / University
                            </FieldLabel>
                            <Input
                              id="institutionName"
                              name="institutionName"
                              placeholder="Daffodil International University"
                              value={formData.institutionName}
                              onChange={handleChange}
                              required={formData.memberIntent === 'unofficial'}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="department">Department (Optional)</FieldLabel>
                            <Input
                              id="department"
                              name="department"
                              placeholder="CSE"
                              value={formData.department}
                              onChange={handleChange}
                            />
                          </Field>
                        </>
                      )}
                      <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          minLength={MIN_PASSWORD_LENGTH}
                          required
                        />
                        <FieldDescription>
                          Password strength: {formData.password.length}/{MIN_PASSWORD_LENGTH}{' '}
                          minimum characters
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          minLength={MIN_PASSWORD_LENGTH}
                          required
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field>
                        <FieldLabel htmlFor="otp">Verification code (OTP)</FieldLabel>
                        <InputOTP
                          id="otp"
                          maxLength={6}
                          pattern={'^\\d+$'}
                          value={otp}
                          onChange={(value) => setOTP(value.replace(/\D/g, ''))}
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
                    </>
                  )}
                  {(error || message) && (
                    <Field>
                      <FieldDescription className={error ? 'text-red-600' : 'text-green-600'}>
                        {error || message}
                      </FieldDescription>
                    </Field>
                  )}
                  <Field>
                    <Button type="submit" disabled={isLoading}>
                      {step === 'signup' ? (
                        isLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner />
                            Creating account...
                          </span>
                        ) : (
                          'Create account'
                        )
                      ) : isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner />
                          Verifying...
                        </span>
                      ) : (
                        'Verify account'
                      )}
                    </Button>
                    <FieldDescription className="text-center">
                      Already have an account? <Link href="/login">Sign in</Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By continuing, you agree to our <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      )}
    </div>
  )
}
