import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

/**
 * Comprehensive seeding script for DPI Computing Society LMS
 * Populates all collections with realistic dummy data
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
    await payload.delete({ collection: 'course-modules', where: {} })
    await payload.delete({ collection: 'enrollments', where: {} })
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'course-reviews', where: {} })
    await payload.delete({ collection: 'activities', where: {} })

    // 1. Create Users (Foundation for everything else)
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

    const editorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'editor@dpirc.edu',
        password: 'editor123',
        roles: ['editor'],
        isActive: true,
      },
    })

    const memberUser = await payload.create({
      collection: 'users',
      data: {
        email: 'member@dpirc.edu',
        password: 'member123',
        roles: ['member'],
        isActive: true,
      },
    })

    // 2. Create Members (Students) - Create instructor members first
    console.log('🎓 Creating instructor members...')
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

    const members = [instructorMember] // Start with instructor member

    // 3. Create Categories
    console.log('📂 Creating categories...')
    const categories = []
    const categoryData = [
      { name: 'Robotics Fundamentals', description: 'Basic robotics concepts and components' },
      { name: 'Programming', description: 'Coding and software development' },
      { name: 'Electronics', description: 'Circuit design and electronics' },
      { name: '3D Printing', description: 'Design and manufacturing with 3D printers' },
      { name: 'Competition Prep', description: 'Preparing for robotics competitions' },
      { name: 'Advanced Projects', description: 'Complex robotics projects' },
    ]

    for (const cat of categoryData) {
      const category = await payload.create({
        collection: 'categories',
        data: {
          name: cat.name,
          description: cat.description,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          status: 'active',
        },
      })
      categories.push(category)
    }

    // 4. Create Courses
    console.log('📚 Creating courses...')
    const courses = []
    const courseData = [
      {
        title: 'Introduction to Robotics',
        description:
          'Learn the basics of robotics including mechanical design, electronics, and programming.',
        category: categories[0].id,
        instructor: instructorMember.id,
        price: 299.99,
        difficulty: 'beginner',
        duration: 40,
        maxStudents: 20,
        prerequisites: [],
        learningObjectives: [
          'Understand basic robotics components',
          'Learn fundamental programming concepts',
          'Build simple robotic systems',
        ],
        syllabus:
          'Week 1-2: Mechanical Design\nWeek 3-4: Electronics Basics\nWeek 5-6: Programming Fundamentals\nWeek 7-8: Integration Project',
        status: 'published',
      },
      {
        title: 'Arduino Programming',
        description: 'Master Arduino microcontroller programming for robotics applications.',
        category: categories[1].id,
        instructor: instructorMember.id,
        price: 199.99,
        difficulty: 'intermediate',
        duration: 30,
        maxStudents: 15,
        prerequisites: ['Introduction to Robotics'],
        learningObjectives: [
          'Understand Arduino architecture',
          'Write efficient Arduino code',
          'Interface with sensors and actuators',
        ],
        syllabus:
          'Week 1: Arduino Basics\nWeek 2: Digital I/O\nWeek 3: Analog I/O\nWeek 4: Communication Protocols\nWeek 5-6: Final Project',
        status: 'published',
      },
      {
        title: '3D Design for Robotics',
        description: 'Learn 3D modeling and printing for custom robotic components.',
        category: categories[3].id,
        instructor: instructorMember.id,
        price: 249.99,
        difficulty: 'beginner',
        duration: 25,
        maxStudents: 12,
        prerequisites: [],
        learningObjectives: [
          'Master 3D modeling software',
          'Understand design principles for robotics',
          'Operate 3D printers effectively',
        ],
        syllabus:
          'Week 1-2: Software Basics\nWeek 3-4: Design Principles\nWeek 5: Printing Techniques\nWeek 6: Final Design Project',
        status: 'published',
      },
      {
        title: 'Advanced Robotics Competition',
        description: 'Prepare for robotics competitions with advanced strategies and techniques.',
        category: categories[4].id,
        instructor: instructorMember.id,
        price: 499.99,
        difficulty: 'advanced',
        duration: 50,
        maxStudents: 10,
        prerequisites: ['Introduction to Robotics', 'Arduino Programming'],
        learningObjectives: [
          'Develop competition strategies',
          'Optimize robot performance',
          'Work effectively in teams',
        ],
        syllabus:
          'Week 1-2: Competition Analysis\nWeek 3-4: Strategy Development\nWeek 5-6: Robot Optimization\nWeek 7-8: Practice Competitions\nWeek 9-10: Final Competition Prep',
        status: 'published',
      },
    ]
    for (const course of courseData) {
      const createdCourse = await payload.create({
        collection: 'courses',
        data: course,
      })
      courses.push(createdCourse)
    }

    // 5. Create Course Modules
    console.log('📖 Creating course modules...')
    const modules = []
    const moduleData = [
      {
        title: 'Mechanical Design Basics',
        description: 'Introduction to mechanical components and design principles',
        course: courses[0].id,
        order: 1,
        content:
          'This module covers the fundamental mechanical components used in robotics including gears, motors, wheels, and structural elements.',
        duration: 120,
        type: 'lesson',
        status: 'published',
      },
      {
        title: 'Basic Programming Concepts',
        description: 'Learn fundamental programming concepts for robotics',
        course: courses[0].id,
        order: 2,
        content:
          'Introduction to programming logic, variables, loops, and conditional statements as they apply to robotics control.',
        duration: 90,
        type: 'lesson',
        status: 'published',
      },
      {
        title: 'Arduino Setup and Configuration',
        description: 'Setting up your Arduino development environment',
        course: courses[1].id,
        order: 1,
        content:
          'Learn how to install Arduino IDE, connect your board, and run your first program.',
        duration: 60,
        type: 'lesson',
        status: 'published',
      },
      {
        title: 'Digital Input/Output',
        description: 'Controlling digital pins and reading digital sensors',
        course: courses[1].id,
        order: 2,
        content:
          'Master digital I/O operations including LED control, button reading, and basic sensor interfacing.',
        duration: 120,
        type: 'lesson',
        status: 'published',
      },
      {
        title: '3D Modeling Fundamentals',
        description: 'Introduction to 3D modeling software and basic shapes',
        course: courses[2].id,
        order: 1,
        content:
          'Learn the basics of 3D modeling including creating primitive shapes, transformations, and basic operations.',
        duration: 180,
        type: 'lesson',
        status: 'published',
      },
      {
        title: 'Competition Strategy Workshop',
        description: 'Developing effective competition strategies',
        course: courses[3].id,
        order: 1,
        content:
          'Analyze past competitions, develop game strategies, and learn to adapt during competition.',
        duration: 240,
        type: 'workshop',
        status: 'published',
      },
    ]

    for (const module of moduleData) {
      const createdModule = await payload.create({
        collection: 'course-modules',
        data: module,
      })
      modules.push(createdModule)
    }

    // 6. Create Enrollments
    console.log('📝 Creating enrollments...')
    const enrollments = []
    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      const courseIndex = i % courses.length
      const course = courses[courseIndex]

      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          member: member.id,
          course: course.id,
          status: ['enrolled', 'in-progress', 'completed'][i % 3],
          enrolledAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt:
            i % 3 === 2 ? new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString() : null,
        },
      })
      enrollments.push(enrollment)
    }

    // 7. Create Blogs
    console.log('📝 Creating blog posts...')
    const blogs = []
    const blogData = [
      {
        title: 'Welcome to DPI Computing Society',
        slug: 'welcome-to-dpi-robotics-club',
        excerpt: 'An introduction to our robotics program and what students can expect to learn.',
        content:
          "Welcome to the DPI Computing Society! Our program is designed to give students hands-on experience with robotics, programming, and engineering principles. Whether you're a complete beginner or have some experience, we have courses and projects that will challenge and excite you.",
        author: instructorUser.id,
        category: categories[0].id,
        tags: ['welcome', 'introduction', 'robotics'],
        status: 'published',
        featured: true,
        seo: {
          metaTitle: 'Welcome to DPI Computing Society - Learn Robotics Today',
          metaDescription:
            'Join DPI Computing Society for hands-on learning in robotics, programming, and engineering. Courses for all skill levels.',
          metaKeywords: 'robotics club, DPI, programming, engineering, STEM',
          canonicalUrl: 'https://dpirc.edu/posts/welcome-to-dpi-robotics-club',
          noIndex: false,
          openGraph: {
            ogTitle: 'Welcome to DPI Computing Society',
            ogDescription: 'Join our robotics program for hands-on STEM learning',
            ogImage: null,
          },
          twitterCard: {
            twitterTitle: 'Welcome to DPI Computing Society',
            twitterDescription: 'Join our robotics program for hands-on STEM learning',
            twitterImage: null,
          },
        },
      },
      {
        title: 'Arduino vs Raspberry Pi: Which is Right for Your Project?',
        slug: 'arduino-vs-raspberry-pi',
        excerpt: 'A comparison of Arduino and Raspberry Pi for robotics projects.',
        content:
          "When starting a robotics project, one of the first decisions you'll need to make is choosing the right microcontroller or single-board computer. Arduino and Raspberry Pi are two popular options, each with their own strengths and use cases.",
        author: instructorUser.id,
        category: categories[1].id,
        tags: ['arduino', 'raspberry-pi', 'microcontrollers', 'comparison'],
        status: 'published',
        featured: false,
        seo: {
          metaTitle: 'Arduino vs Raspberry Pi: Choose the Right Board for Your Robotics Project',
          metaDescription:
            'Compare Arduino and Raspberry Pi for robotics projects. Learn which microcontroller is best for your needs.',
          metaKeywords: 'arduino, raspberry pi, robotics, microcontrollers, comparison',
          canonicalUrl: 'https://dpirc.edu/posts/arduino-vs-raspberry-pi',
          noIndex: false,
          openGraph: {
            ogTitle: 'Arduino vs Raspberry Pi: Which is Right for Your Project?',
            ogDescription: 'Compare Arduino and Raspberry Pi for robotics projects',
            ogImage: null,
          },
          twitterCard: {
            twitterTitle: 'Arduino vs Raspberry Pi Comparison',
            twitterDescription: 'Compare Arduino and Raspberry Pi for robotics projects',
            twitterImage: null,
          },
        },
      },
      {
        title: '3D Printing Tips for Robotics Components',
        slug: '3d-printing-tips-robotics',
        excerpt: 'Essential tips for 3D printing custom robotics parts.',
        content:
          '3D printing has revolutionized how we create custom robotics components. Here are some essential tips to help you get the best results from your 3D printed parts.',
        author: editorUser.id,
        category: categories[3].id,
        tags: ['3d-printing', 'manufacturing', 'tips', 'components'],
        status: 'published',
        featured: false,
        seo: {
          metaTitle: '3D Printing Tips for Robotics Components - DPI Computing Society',
          metaDescription:
            'Learn essential 3D printing tips for creating custom robotics components. Improve your prints with these expert techniques.',
          metaKeywords: '3D printing, robotics, components, tips, manufacturing',
          canonicalUrl: 'https://dpirc.edu/posts/3d-printing-tips-robotics',
          noIndex: false,
          openGraph: {
            ogTitle: '3D Printing Tips for Robotics Components',
            ogDescription: 'Essential tips for 3D printing custom robotics parts',
            ogImage: null,
          },
          twitterCard: {
            twitterTitle: '3D Printing Tips for Robotics',
            twitterDescription: 'Essential tips for 3D printing custom robotics parts',
            twitterImage: null,
          },
        },
      },
    ]

    for (const blog of blogData) {
      const createdBlog = await payload.create({
        collection: 'posts',
        data: blog,
      })
      blogs.push(createdBlog)
    }

    // 9. Create Reviews
    console.log('⭐ Creating reviews...')
    const reviews = []
    const reviewData = [
      {
        member: members[0].id,
        course: courses[0].id,
        rating: 5,
        title: 'Excellent Introduction Course',
        content:
          'This course provided a great foundation for robotics. The instructor was knowledgeable and the hands-on projects were engaging.',
        status: 'published',
        verified: true,
      },
      {
        member: members[1].id,
        course: courses[1].id,
        rating: 4,
        title: 'Challenging but Rewarding',
        content:
          'The Arduino programming course was challenging but I learned a lot. Would recommend for students with some programming background.',
        status: 'published',
        verified: true,
      },
      {
        member: members[2].id,
        course: courses[2].id,
        rating: 5,
        title: 'Perfect for Beginners',
        content:
          'As someone new to 3D printing, this course was exactly what I needed. Clear instructions and helpful instructors.',
        status: 'published',
        verified: true,
      },
    ]

    for (const review of reviewData) {
      const createdReview = await payload.create({
        collection: 'course-reviews',
        data: review,
      })
      reviews.push(createdReview)
    }

    // 10. Create Activities (Audit trail)
    console.log('📋 Creating activities...')
    const activities = []
    const activityData = [
      {
        user: adminUser.id,
        action: 'create',
        resourceType: 'user',
        resourceId: instructorUser.id,
        description: 'Created instructor account',
        metadata: { email: instructorUser.email },
      },
      {
        user: instructorUser.id,
        action: 'create',
        resourceType: 'course',
        resourceId: courses[0].id,
        description: 'Created Introduction to Robotics course',
        metadata: { title: courses[0].title },
      },
      {
        user: members[0].id,
        action: 'enroll',
        resourceType: 'course',
        resourceId: courses[0].id,
        description: 'Enrolled in Introduction to Robotics',
        metadata: { courseTitle: courses[0].title },
      },
      {
        user: members[0].id,
        action: 'complete',
        resourceType: 'course',
        resourceId: courses[0].id,
        description: 'Completed Introduction to Robotics course',
        metadata: { courseTitle: courses[0].title, grade: 'Pass', score: 85 },
      },
    ]

    for (const activity of activityData) {
      const createdActivity = await payload.create({
        collection: 'activities',
        data: activity,
      })
      activities.push(createdActivity)
    }

    console.log('✅ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${4}`)
    console.log(`🎓 Members: ${members.length}`)
    console.log(`📂 Categories: ${categories.length}`)
    console.log(`📚 Courses: ${courses.length}`)
    console.log(`📖 Modules: ${modules.length}`)
    console.log(`📝 Enrollments: ${enrollments.length}`)
    console.log(` Blog Posts: ${blogs.length}`)
    console.log(`⭐ Reviews: ${reviews.length}`)
    console.log(`🎨 Certificate Templates: ${certificateTemplates.length}`)
    console.log(`🏆 Certificates: ${certificates.length}`)
    console.log(`📋 Activities: ${activities.length}`)

    console.log('\n🔐 Test Accounts:')
    console.log(
      `Admin: ${process.env.ADMIN_EMAIL || 'admin@dpirc.edu'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`,
    )
    console.log('Instructor: instructor@dpirc.edu / instructor123')
    console.log('Editor: editor@dpirc.edu / editor123')
    console.log('Member: member@dpirc.edu / member123')
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
