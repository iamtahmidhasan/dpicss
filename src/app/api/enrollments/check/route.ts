import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const courseSlug = searchParams.get('courseSlug')
  const userId = searchParams.get('userId')

  if (!courseSlug || !userId) {
    return NextResponse.json({ enrolled: false }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    const courseResult = await payload.find({
      collection: 'courses',
      where: { slug: { equals: courseSlug } },
      limit: 1,
      depth: 0,
    })

    if (!courseResult.docs.length) {
      return NextResponse.json({ enrolled: false }, { status: 404 })
    }

    const courseId = courseResult.docs[0].id

    const enrollmentResult = await payload.find({
      collection: 'enrollments',
      where: {
        and: [
          { student: { equals: userId } },
          { course: { equals: courseId } },
          { status: { in: ['active', 'completed'] } },
        ],
      },
      limit: 1,
      depth: 0,
    })

    const enrolled = enrollmentResult.docs.length > 0

    return NextResponse.json({ enrolled })
  } catch (error) {
    console.error('Enrollment check error:', error)
    return NextResponse.json({ enrolled: false }, { status: 500 })
  }
}