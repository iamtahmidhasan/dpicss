import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

async function getUserFromRequest(request: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return null

  return {
    id: user.id as string,
    memberCategory: user.memberCategory as string | undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId } = body

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const course = await payload.findByID({
      collection: 'courses',
      id: courseId,
      depth: 0,
      overrideAccess: true,
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const existingEnrollment = await payload.find({
      collection: 'enrollments',
      where: {
        and: [
          { student: { equals: user.id } },
          { course: { equals: courseId } },
          { status: { in: ['active', 'completed', 'pending'] } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existingEnrollment.docs.length > 0) {
      const existingStatus = existingEnrollment.docs[0].status as string
      if (existingStatus === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending enrollment request for this course' },
          { status: 409 }
        )
      }
      if (existingStatus === 'active' || existingStatus === 'completed') {
        return NextResponse.json(
          { error: 'You are already enrolled in this course' },
          { status: 409 }
        )
      }
    }

    const memberCategory = user.memberCategory || 'unofficial'

    await payload.create({
      collection: 'enrollments' as any,
      data: {
        student: user.id,
        course: courseId,
        status: 'active',
        memberType: memberCategory === 'official' ? 'official' : 'unofficial',
        payment: {
          method: 'free',
          amount: 0,
        },
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      message: 'Successfully enrolled in the course',
    })
  } catch (error) {
    console.error('[Free Enrollment] Error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll' },
      { status: 500 }
    )
  }
}