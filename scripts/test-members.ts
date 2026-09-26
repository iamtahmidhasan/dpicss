import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

/**
 * Test member creation like the full seeding script
 */
async function testMemberCreation(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🧪 Testing member creation like full script...')

  try {
    // Clean up
    await payload.delete({ collection: 'members', where: {} })

    const memberNames = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@dpirc.edu' },
      { firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@dpirc.edu' },
      { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.brown@dpirc.edu' },
      { firstName: 'Diana', lastName: 'Wilson', email: 'diana.wilson@dpirc.edu' },
      { firstName: 'Ethan', lastName: 'Davis', email: 'ethan.davis@dpirc.edu' },
    ]

    for (let i = 0; i < memberNames.length; i++) {
      console.log(
        `Creating member ${i + 1}: ${memberNames[i].firstName} ${memberNames[i].lastName}`,
      )

      const member = await payload.create({
        collection: 'members',
        data: {
          memberId: `DPIRC-M-${String(i + 1).padStart(4, '0')}`,
          firstName: memberNames[i].firstName,
          lastName: memberNames[i].lastName,
          email: memberNames[i].email,
          phone: `555-010${i}`,
          dateOfBirth: new Date(2005 + (i % 5), i % 12, 15).toISOString(),
          grade: ['9th', '10th', '11th', '12th'][i % 4],
          interests: ['Robotics', 'Programming', 'Electronics', '3D Printing'].slice(
            0,
            (i % 3) + 1,
          ),
          emergencyContact: {
            name: `${memberNames[i].lastName} Parent`,
            phone: `555-020${i}`,
            relationship: 'Parent',
          },
          status: 'active',
          // user field commented out in schema
        },
      })
      console.log(`✅ Member created: ${member.id}`)
    }

    console.log('🎉 All members created successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testMemberCreation().catch(console.error)
