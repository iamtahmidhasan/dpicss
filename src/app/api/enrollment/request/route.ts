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
    const payload = await getPayload({ config })
    const body = await request.json()
    const { courseId, email, paymentMethod, transactionId, senderNumber, notes } = body

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    if (!courseId || !email || !paymentMethod) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const isCash = paymentMethod === 'cash'
    if (!isCash && !transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required for online payments' }, { status: 400 })
    }

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

    const enrollmentData: Record<string, unknown> = {
      student: user.id,
      course: courseId,
      status: 'pending',
      memberType: memberCategory === 'official' ? 'official' : 'unofficial',
      adminNotes: `Sender: ${senderNumber || 'N/A'}\n${notes || ''}`,
    }

    if (isCash) {
      enrollmentData.payment = {
        method: paymentMethod,
        notes: notes || '',
      }
    } else {
      enrollmentData.payment = {
        method: paymentMethod,
        transactionId,
        notes: notes || '',
      }
    }

    await payload.create({
      collection: 'enrollments' as any,
      data: enrollmentData,
      overrideAccess: true,
    })

    return NextResponse.json({
      message: 'Enrollment request submitted successfully. Admin will review and approve your enrollment.',
    })
  } catch (error) {
    console.error('[Enrollment Request] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit enrollment request' },
      { status: 500 }
    )
  }
}