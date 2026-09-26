import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

/**
 * Simple test seeding script
 */
async function testSeed(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🧪 Testing member creation...')

  try {
    // Clean up
    await payload.delete({ collection: 'users', where: {} })
    await payload.delete({ collection: 'members', where: {} })

    // Create a simple user first
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'test@example.com',
        password: 'test123',
        roles: ['admin'],
        isActive: true,
      },
    })

    console.log('✅ User created successfully:', user.id)

    // Try to create a member
    const member = await payload.create({
      collection: 'members',
      data: {
        memberId: 'TEST-0001',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-0123',
        dateOfBirth: '2005-01-01T00:00:00.000Z',
        grade: '10th',
        interests: ['Robotics'],
        emergencyContact: {
          name: 'Test Parent',
          phone: '555-0456',
          relationship: 'Parent',
        },
        status: 'active',
      },
    })

    console.log('✅ Member created successfully:', member.id)
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

testSeed()
  .then(() => {
    console.log('🎉 Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
