import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const HomeSettings: GlobalConfig = {
  slug: 'home-settings',
  label: 'Home Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Hero Section',
      fields: [
        { name: 'bar', type: 'text', localized: true, defaultValue: 'Official club homepage' },
        { name: 'barSub', type: 'text', localized: true, defaultValue: 'Live updates, events, and project stories for every member.' },
        { name: 'globeLabel', type: 'text', localized: true, defaultValue: 'Global robotics community' },
        { name: 'globeCopy', type: 'text', localized: true, defaultValue: 'A collaborative space for students, creators, and mentors to build smarter robots.' },
        { name: 'point1', type: 'text', localized: true, defaultValue: 'Live build nights' },
        { name: 'point2', type: 'text', localized: true, defaultValue: 'Mentor-led workshops' },
        { name: 'point3', type: 'text', localized: true, defaultValue: 'Competition-ready training' },
      ],
    },
    { name: 'badge', type: 'text', localized: true, defaultValue: 'DPI Robotics Club' },
    { name: 'title1', type: 'text', localized: true, defaultValue: 'Build robots ' },
    {
      name: 'titleRotating',
      type: 'array',
      label: 'Rotating Title Words',
      fields: [{ name: 'word', type: 'text', required: true, localized: true }],
      defaultValue: [
        { word: 'with passion.' },
        { word: 'with purpose.' },
        { word: 'with precision.' },
        { word: 'together.' },
      ],
    },
    { name: 'title2', type: 'text', localized: true, defaultValue: 'Learn fast.' },
    { name: 'description', type: 'textarea', localized: true, defaultValue: 'A student led community at Dhaka Government Polytechnic Institute focused on real world robotics mechanical design, embedded systems, programming, and teamwork.' },
    {
      name: 'buttons',
      type: 'group',
      fields: [
        { name: 'join', type: 'text', localized: true, defaultValue: 'Join the club' },
        { name: 'login', type: 'text', localized: true, defaultValue: 'Member login' },
        { name: 'account', type: 'text', localized: true, defaultValue: 'Go to dashboard' },
        { name: 'explore', type: 'text', localized: true, defaultValue: 'Browse members' },
      ],
    },
    {
      name: 'projectsSection',
      type: 'group',
      label: 'Projects Section',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Our Projects' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Innovation in motion. Explore our latest robotic breakthroughs and technical research.' },
        { name: 'viewAll', type: 'text', localized: true, defaultValue: 'View All Projects' },
      ],
    },
    {
      name: 'eventsSection',
      type: 'group',
      label: 'Events Section',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Experience the Future' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Join our elite workshops and high-stakes robotics competitions designed to push technical boundaries.' },
      ],
    },
    {
      name: 'achievementsSection',
      type: 'group',
      label: 'Achievements Section',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'Our Impact' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'By the Numbers' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Providing effective tools to improve workflows, boost efficiency, and encourage growth.' },
      ],
    },
    {
      name: 'teamSection',
      type: 'group',
      label: 'Team Section',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Founding Team' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Meet the brilliant minds who started this robotics journey and continue to lead our vision.' },
      ],
    },
    {
      name: 'coursesSection',
      type: 'group',
      label: 'Courses Section',
      fields: [
        { name: 'label', type: 'text', localized: true, defaultValue: 'Learning' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Featured Courses' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Master robotics and technology with our expert-led courses designed for all skill levels.' },
      ],
    },
    {
      name: 'postsSection',
      type: 'group',
      label: 'Posts Section',
      fields: [
        { name: 'label', type: 'text', localized: true, defaultValue: 'Blog' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Latest Updates' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Stay informed with the latest news, tutorials, and insights from the world of robotics.' },
      ],
    },
    {
      name: 'features',
      type: 'group',
      label: 'Features / Programs Section',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'What we offer' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'What we do' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'From fundamentals to full builds designed for consistent progress every week.' },
        {
          name: 'workshops',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Workshops & Training' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Hands on sessions in robotics, embedded programming, CAD, and rapid prototyping beginner friendly.' },
          ],
        },
        {
          name: 'buildNight',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Build Nights' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Weekly build meetups where we design, iterate, and ship real robots together.' },
          ],
        },
        {
          name: 'competition',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Competitions' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Prepare for local and national competitions strategy, testing, teamwork, and performance.' },
          ],
        },
        {
          name: 'mentorship',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Mentorship' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Learn by doing with guidance from senior members code reviews, design critiques, and career support.' },
          ],
        },
      ],
    },
    {
      name: 'workflow',
      type: 'group',
      label: 'Workflow Section',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'A simple rhythm' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Learn → Build → Compete' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'We keep it practical: short lessons, lots of building, and frequent demos.' },
        {
          name: 'step1',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Start with a track' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Pick embedded, software, mechanical, or design switch anytime.' },
          ],
        },
        {
          name: 'step2',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Build with support' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Pair up and collaborate with weekly goals and a shared repo.' },
          ],
        },
        {
          name: 'step3',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', localized: true, defaultValue: 'Showcase your work' },
            { name: 'description', type: 'textarea', localized: true, defaultValue: 'Demos, feedback, and improvements then we take it to competitions.' },
          ],
        },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      label: 'Stats Section',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'Club momentum' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Project success at a glance' },
        { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Real numbers from members, courses, and community activity.' },
        { name: 'members', type: 'text', localized: true, defaultValue: 'Club members' },
        { name: 'courses', type: 'text', localized: true, defaultValue: 'Workshops & courses' },
        { name: 'posts', type: 'text', localized: true, defaultValue: 'Posts & updates' },
        { name: 'memberGrowth', type: 'text', localized: true, defaultValue: 'Consistent growth' },
        { name: 'weeklyMeetups', type: 'text', localized: true, defaultValue: 'Weekly meetups' },
        { name: 'communityTalks', type: 'text', localized: true, defaultValue: 'Community talks' },
        { name: 'detail1', type: 'textarea', localized: true, defaultValue: 'A network that keeps growing with each semester.' },
        { name: 'detail2', type: 'textarea', localized: true, defaultValue: 'Hands on practice sessions that move projects forward.' },
        { name: 'detail3', type: 'textarea', localized: true, defaultValue: 'Feedback, mentorship, and collaborative learning.' },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Call to Action Section',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'Get started' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Ready to build your next robot?' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Join DPI Robotics Club today and start shipping real projects with mentorship and momentum.' },
        {
          name: 'buttons',
          type: 'group',
          fields: [
            { name: 'join', type: 'text', localized: true, defaultValue: 'Join the club' },
            { name: 'login', type: 'text', localized: true, defaultValue: 'Member login' },
            { name: 'dashboard', type: 'text', localized: true, defaultValue: 'Go to dashboard' },
            { name: 'explore', type: 'text', localized: true, defaultValue: 'Browse members' },
          ],
        },
      ],
    },
  ],
}
