'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CourseEnrollmentStatusProps {
  courseSlug: string
}

export function CourseEnrollmentStatus({ courseSlug }: CourseEnrollmentStatusProps) {
  return (
    <Button asChild size="sm" className="shrink-0">
      <Link href={`/courses/${courseSlug}`}>View Course</Link>
    </Button>
  )
}