import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const courses = await payload.find({
    collection: 'courses',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    select: { id: true, enrollmentCount: true, title: true },
  })

  let updated = 0

  for (const course of courses.docs) {
    const courseId = String(course.id)

    const countResult = await payload.count({
      collection: 'enrollments',
      where: {
        and: [{ course: { equals: courseId } }, { status: { in: ['active', 'completed'] } }],
      },
      overrideAccess: true,
    })

    const actual = countResult.totalDocs || 0
    const current = Number(course.enrollmentCount || 0)

    if (actual !== current) {
      await payload.update({
        collection: 'courses',
        id: courseId,
        data: { enrollmentCount: actual },
        overrideAccess: true,
      })
      updated += 1
      console.log(`[reconcile] course=${courseId} count ${current} -> ${actual}`)
    }
  }

  console.log(`[reconcile] done, updated ${updated} of ${courses.docs.length} courses`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[reconcile] failed', error)
    process.exit(1)
  })
