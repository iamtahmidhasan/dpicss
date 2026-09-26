import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

/**
 * Script to generate usernames for existing members that don't have them
 */
async function generateUsernames(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🔄 Generating usernames for existing members...')

  try {
    // Find members without usernames
    const membersWithoutUsernames = await payload.find({
      collection: 'members',
      where: {
        username: { exists: false },
      },
      limit: 1000,
    })

    console.log(`Found ${membersWithoutUsernames.docs.length} members without usernames`)

    for (const member of membersWithoutUsernames.docs) {
      const first = typeof member.firstName === 'string' ? member.firstName : ''
      const last = typeof member.lastName === 'string' ? member.lastName : ''
      const fallback =
        typeof member.memberId === 'string' ? member.memberId.toLowerCase() : 'member'
      const base =
        `${first}-${last}`
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-') || fallback

      let candidate = base
      let counter = 1
      while (counter <= 50) {
        const existing = await payload.find({
          collection: 'members',
          where: { username: { equals: candidate } },
          limit: 1,
          depth: 0,
        })
        if (existing.docs.length === 0) {
          await payload.update({
            collection: 'members',
            id: member.id,
            data: { username: candidate },
          })
          console.log(
            `✅ Updated ${member.firstName} ${member.lastName} with username: ${candidate}`,
          )
          break
        }
        counter += 1
        candidate = `${base}-${counter}`
      }
    }

    console.log('🎉 Username generation completed!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

generateUsernames().catch(console.error)
