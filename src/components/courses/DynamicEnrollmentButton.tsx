'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EnrollmentDialog } from '@/components/enrollment/EnrollmentDialog'

type CourseData = {
  id: string
  title: Record<string, string> | string
  pricing?: {
    member?: number
    unofficial?: number
    currency?: string
  }
  memberType?: 'official' | 'unofficial' | 'both'
  paymentInfo?: {
    useCustomPayment?: boolean
    bkashNumber?: string
    nagadNumber?: string
    rocketNumber?: string
    cashInstructions?: string
  }
  slug: string
}

type Props = {
  course: CourseData
  locale: string
  price: number
  currency: string
  isActive: boolean
  isPending: boolean
  userEmail: string | null
}

export function DynamicEnrollmentButton({
  course,
  locale,
  price,
  currency,
  isActive,
  isPending,
  userEmail,
}: Props) {
  const [hasCheckedUser, setHasCheckedUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!userEmail) {
      const userStr = localStorage.getItem('payload-user')
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          if (userData.email) {
            setHasCheckedUser(true)
            return
          }
        } catch {
          // ignore
        }
      }
    }
    setHasCheckedUser(true)
  }, [userEmail])

  const getLocalizedTitle = (): string => {
    if (!course.title) return ''
    if (typeof course.title === 'string') return course.title
    return course.title[locale] || course.title['en'] || ''
  }

  if (!hasCheckedUser) {
    return (
      <Button className="w-full" size="lg" asChild>
        <Link href={`/register?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`}>
          Join to Enroll
        </Link>
      </Button>
    )
  }

  if (!userEmail) {
    return (
      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`)}
      >
        Login to Enroll
      </Button>
    )
  }

  if (isActive) {
    return (
      <>
        <Button className="w-full" size="lg" asChild>
          <a href="#curriculum">Continue Learning</a>
        </Button>
        <p className="text-center text-xs text-success font-medium">
          You're enrolled in this course
        </p>
      </>
    )
  }

  if (isPending) {
    return (
      <>
        <Button className="w-full" size="lg" disabled variant="secondary">
          Pending Approval
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Your enrollment is waiting for admin approval
        </p>
      </>
    )
  }

  if (price <= 0) {
    return (
      <FreeEnrollmentButton
        courseId={course.id}
        userEmail={userEmail}
        courseTitle={getLocalizedTitle()}
      />
    )
  }

  return (
    <PaidEnrollmentButton
      course={{
        id: course.id,
        title: getLocalizedTitle(),
        price,
        currency: course.pricing?.currency || 'BDT',
        memberType: course.memberType || 'unofficial',
        paymentInfo: course.paymentInfo,
      }}
      userEmail={userEmail}
    />
  )
}

function FreeEnrollmentButton({
  courseId,
  userEmail,
  courseTitle,
}: {
  courseId: string
  userEmail: string
  courseTitle: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFreeEnroll = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/enrollment/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to enroll')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button className="w-full" size="lg" onClick={handleFreeEnroll} disabled={isLoading}>
        {isLoading ? 'Enrolling...' : 'Enroll for Free'}
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </>
  )
}

function PaidEnrollmentButton({
  course,
  userEmail,
}: {
  course: { 
    id: string; 
    title: string; 
    price: number; 
    currency: string; 
    memberType: 'official' | 'unofficial' | 'both'
    paymentInfo?: {
      useCustomPayment?: boolean
      bkashNumber?: string
      nagadNumber?: string
      rocketNumber?: string
      cashInstructions?: string
    }
  }
  userEmail: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button className="w-full" size="lg" onClick={() => setIsOpen(true)}>
        Enroll Now
      </Button>
      <EnrollmentDialog
        course={course}
        userEmail={userEmail}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}