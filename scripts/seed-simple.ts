import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

/**
 * Simple seeding script for DPI Computing Society LMS
 */
async function seedDatabase(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🌱 Starting database seeding...')

  try {
    // Clean up existing data first
    console.log('🧹 Cleaning up existing data...')
    await payload.delete({ collection: 'users', where: {} })
    await payload.delete({ collection: 'members', where: {} })
    await payload.delete({ collection: 'categories', where: {} })
    await payload.delete({ collection: 'courses', where: {} })
    await payload.delete({ collection: 'posts', where: {} })

    // 1. Create Users
    console.log('👥 Creating users...')
    const adminUser = await payload.create({
      collection: 'users',
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@dpirc.edu',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        roles: ['admin'],
        isActive: true,
      },
    })

    const instructorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'instructor@dpirc.edu',
        password: 'instructor123',
        roles: ['instructor'],
        isActive: true,
      },
    })

    // 2. Create Instructor Member
    console.log('🎓 Creating instructor member...')
    const instructorMember = await payload.create({
      collection: 'members',
      data: {
        memberId: 'DPIRC-M-0001',
        firstName: 'Dr.',
        lastName: 'Smith',
        email: 'instructor@dpirc.edu',
        phone: '555-0100',
        dateOfBirth: '1980-01-01T00:00:00.000Z',
        grade: '12th',
        interests: ['Robotics', 'Programming'],
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '555-0200',
          relationship: 'Spouse',
        },
        status: 'active',
        memberType: 'instructor',
      },
    })

    // 3. Create Blog Categories
    console.log('📂 Creating blog categories...')
    console.log('📚 Creating courses...')
    const courses = []
    const courseData = [
      {
        title: 'Introduction to Robotics',
        slug: 'intro-robotics',
        shortDescription:
          'Learn the basics of robotics including mechanical design, electronics, and programming.',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Learn the basics of robotics including mechanical design, electronics, and programming. This comprehensive course covers mechanical components, programming fundamentals, and hands-on projects.',
                  },
                ],
              },
            ],
          },
        },
        category: 'robotics-fundamentals',
        instructor: instructorMember.id,
        memberType: 'both',
        pricing: {
          officialMemberPrice: 299.99,
          unofficialMemberPrice: 399.99,
          currency: 'BDT',
        },
        level: 'beginner',
        status: 'published',
        duration: { totalHours: 40, totalWeeks: 8 },
        enrollmentContact: {
          whatsappNumber: '+8801711223344',
          whatsappMessage:
            'Hi, I want to enroll in {courseName}. Please guide me through the payment process.',
        },
        modules: [
          {
            title: 'Mechanical Design Basics',
            description: 'Introduction to mechanical components and design principles',
            order: 1,
            lessons: [
              {
                title: 'Introduction to Mechanical Components',
                type: 'video',
                order: 1,
                duration: '12:34',
                isFreePreview: true,
                videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
              },
              {
                title: 'Motors and Actuators',
                type: 'video',
                order: 2,
                duration: '15:20',
                isFreePreview: false,
                videoUrl: 'https://www.youtube.com/embed/xfr64zoBFp4',
              },
              {
                title: 'Gearing Systems',
                type: 'document',
                order: 3,
                duration: '8 min read',
                isFreePreview: false,
                description: 'Learn about different gearing systems used in robotics',
              },
            ],
          },
          {
            title: 'Basic Programming Concepts',
            description: 'Learn fundamental programming concepts for robotics',
            order: 2,
            lessons: [
              {
                title: 'Programming Fundamentals',
                type: 'video',
                order: 1,
                duration: '18:45',
                isFreePreview: false,
                videoUrl: 'https://www.youtube.com/embed/0jTAGW_4VB8',
              },
              {
                title: 'Variables and Data Types',
                type: 'video',
                order: 2,
                duration: '14:30',
                isFreePreview: false,
                videoUrl: 'https://www.youtube.com/embed/4ZVSMhI1TTM',
              },
            ],
          },
        ],
      },
      {
        title: 'Arduino Programming',
        slug: 'arduino-programming',
        shortDescription: 'Master Arduino microcontroller programming for robotics applications.',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Master Arduino microcontroller programming for robotics applications. Learn digital I/O, analog inputs, communication protocols, and build real-world robotics projects.',
                  },
                ],
              },
            ],
          },
        },
        category: 'programming',
        instructor: instructorMember.id,
        memberType: 'both',
        pricing: {
          officialMemberPrice: 199.99,
          unofficialMemberPrice: 299.99,
          currency: 'BDT',
        },
        level: 'intermediate',
        status: 'published',
        duration: { totalHours: 30, totalWeeks: 6 },
        enrollmentContact: {
          whatsappNumber: '+8801711223344',
          whatsappMessage:
            'Hi, I want to enroll in {courseName}. Please guide me through the payment process.',
        },
        modules: [
          {
            title: 'Arduino Setup and Configuration',
            description: 'Setting up your Arduino development environment',
            order: 1,
            lessons: [
              {
                title: 'Arduino IDE Installation',
                type: 'video',
                order: 1,
                duration: '10:15',
                isFreePreview: true,
                videoUrl: 'https://www.youtube.com/embed/FZ8BxMU3BHc',
              },
              {
                title: 'First Program: Blink LED',
                type: 'video',
                order: 2,
                duration: '12:40',
                isFreePreview: true,
                videoUrl: 'https://www.youtube.com/embed/VNtFvg7DtKE',
              },
            ],
          },
          {
            title: 'Digital Input/Output',
            description: 'Controlling digital pins and reading digital sensors',
            order: 2,
            lessons: [
              {
                title: 'Digital Output Control',
                type: 'video',
                order: 1,
                duration: '16:20',
                isFreePreview: false,
                videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
              },
              {
                title: 'Reading Digital Inputs',
                type: 'video',
                order: 2,
                duration: '14:50',
                isFreePreview: false,
                videoUrl: 'https://www.youtube.com/embed/xfr64zoBFp4',
              },
            ],
          },
        ],
      },
    ]

    for (const course of courseData) {
      try {
        const createdCourse = await payload.create({
          collection: 'courses',
          data: course,
        })
        courses.push(createdCourse)
      } catch (err) {
        console.error(
          `Failed to create course "${course.title}":`,
          err instanceof Error ? err.message : String(err),
        )
      }
    }

    // 5. Create Blog Categories
    console.log('📂 Creating blog categories...')
    const blogCategories = []
    const blogCategoryData = [
      { name: 'Tutorials', description: 'Step-by-step guides and tutorials', type: 'post' },
      { name: 'News', description: 'Latest updates and announcements', type: 'post' },
    ]

    for (const cat of blogCategoryData) {
      const category = await payload.create({
        collection: 'categories',
        data: {
          name: cat.name,
          description: cat.description,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          type: cat.type,
          status: 'active',
        },
      })
      blogCategories.push(category)
    }

    // 6. Create Blog Posts - Skipped for now
    // (Blog posts require content field which needs Lexical structure)
    const blogs: unknown[] = []

    // 7. Create Test Enrollments
    console.log('📚 Creating test enrollments...')
    try {
      for (const course of courses) {
        await payload.create({
          collection: 'enrollments',
          data: {
            student: instructorUser.id,
            course: course.id,
            status: 'active',
          },
        })
      }
      console.log(`✅ Created ${courses.length} test enrollments`)
    } catch (err) {
      console.warn(
        '⚠️  Failed to create test enrollments (may already exist):',
        err instanceof Error ? err.message : String(err),
      )
    }

    console.log('✅ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: 2`)
    console.log(`🎓 Members: 1`)
    console.log(`📚 Courses: ${courses.length}`)
    console.log(`📝 Blog Posts: ${blogs.length}`)

    console.log('\n🔐 Test Accounts:')
    console.log(
      `Admin: ${process.env.ADMIN_EMAIL || 'admin@dpirc.edu'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`,
    )
    console.log('Instructor: instructor@dpirc.edu / instructor123')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run the seeding script
seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding completed! You can now explore the LMS with dummy data.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
