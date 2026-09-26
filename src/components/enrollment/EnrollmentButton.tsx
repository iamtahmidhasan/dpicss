'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { EnrollmentDialog } from '@/components/enrollment/EnrollmentDialog'

type CourseInfo = {
  id: string
  title: string
  price: number
  currency: string
  memberType: 'official' | 'unofficial' | 'both'
}

type Props = {
  course: CourseInfo
}

export function EnrollmentButton({ course }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('payload-user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserEmail(user.email || '')
      } catch {
        // ignore
      }
    }
  }, [])

  if (!userEmail) {
    return null
  }

  return (
    <>
      <Button 
        className="w-full" 
        size="lg" 
        onClick={() => setIsOpen(true)}
      >
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