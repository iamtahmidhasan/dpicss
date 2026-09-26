import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const AboutSettings: GlobalConfig = {
  slug: 'about-settings',
  label: 'About Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    { name: 'badge', type: 'text', localized: true, defaultValue: 'About DPI Robotics Club' },
    { name: 'title', type: 'text', localized: true, defaultValue: 'Building Future Innovators Through Robotics & Technology' },
    { name: 'description', type: 'textarea', localized: true, defaultValue: 'Dhaka Polytechnic Institute Robotics Club (DPIRC) is a student-led organization dedicated to fostering innovation, creativity, and technical excellence in robotics and related technologies.' },
    {
      name: 'innovation',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Innovation' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Encouraging students to transform ideas into real-world robotics solutions.' },
      ],
    },
    {
      name: 'collaboration',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Collaboration' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Building a strong community of engineers, developers, and innovators.' },
      ],
    },
    {
      name: 'technical',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Technical Excellence' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Promoting hands-on learning through projects, workshops, and competitions.' },
      ],
    },
    {
      name: 'mission',
      type: 'group',
      label: 'Mission',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'Our Mission' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Empowering Students Through Practical Learning' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Our mission is to empower students with practical knowledge and hands-on experience in robotics and embedded systems. We aim to develop problem-solving skills, creativity, and technical excellence through workshops, projects, and competitive participation at national and international levels.' },
      ],
    },
    {
      name: 'vision',
      type: 'group',
      label: 'Vision',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'Our Vision' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'Inspiring The Next Generation Of Innovators' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'We envision creating a generation of technology-driven leaders and innovators who will contribute to the advancement of robotics and engineering in Bangladesh and beyond.' },
        { name: 'description2', type: 'textarea', localized: true, defaultValue: 'DPI Robotics Club strives to inspire students to think beyond textbooks and turn their imagination into real-world applications.' },
        { name: 'description2Title', type: 'text', localized: true, defaultValue: 'A Future Built Together' },
      ],
    },
    {
      name: 'join',
      type: 'group',
      label: 'Join Section',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Ready to join us?' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Become part of a community that is shaping the future of technology. Whether you are a beginner or an expert, there is a place for you here.' },
        { name: 'button', type: 'text', localized: true, defaultValue: 'Get Started' },
      ],
    },
    {
      name: 'founder',
      type: 'group',
      label: 'Governing Body / Founder Section',
      fields: [
        { name: 'badge', type: 'text', localized: true, defaultValue: 'Governing Body' },
        { name: 'title', type: 'text', localized: true, defaultValue: 'DPI Robotics Club Governing body' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'The Founder Team of DPI Robotics Club laid the foundation of innovation, leadership, and technical excellence at Dhaka Polytechnic Institute.' },
      ],
    },
    {
      name: 'sharedVision',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Shared Vision' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'With a shared passion for robotics and technology, the founders transformed an idea into a thriving platform for future engineers and innovators.' },
      ],
    },
    {
      name: 'leadership',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Leadership & Growth' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Their dedication, hard work, and forward-thinking mindset shaped the club\'s culture of creativity, collaboration, and continuous learning.' },
        { name: 'description2', type: 'textarea', localized: true, defaultValue: 'Today, DPI Robotics Club stands as a recognized hub for robotics education, project development, and competitive success.' },
      ],
    },
    {
      name: 'achievements',
      type: 'group',
      label: 'Achievements Stats',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Our Achievements in Numbers' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Our journey of innovation and growth in numbers' },
      ],
    },
    {
      name: 'heroCard',
      type: 'group',
      label: 'Hero Card',
      fields: [
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Empowering students with practical robotics knowledge and hands-on experience.' },
        { name: 'exploreCourses', type: 'text', localized: true, defaultValue: 'Explore Courses' },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      label: 'Achievement Stats Labels',
      fields: [
        { name: 'achievement1Label', type: 'text', localized: true, defaultValue: 'Active Members' },
        { name: 'achievement1Value', type: 'text', localized: true, defaultValue: '150+' },
        { name: 'achievement2Label', type: 'text', localized: true, defaultValue: 'Projects Built' },
        { name: 'achievement2Value', type: 'text', localized: true, defaultValue: '50+' },
        { name: 'achievement3Label', type: 'text', localized: true, defaultValue: 'Awards Won' },
        { name: 'achievement3Value', type: 'text', localized: true, defaultValue: '25+' },
        { name: 'achievement4Label', type: 'text', localized: true, defaultValue: 'Workshops Held' },
        { name: 'achievement4Value', type: 'text', localized: true, defaultValue: '40+' },
      ],
    },
    {
      name: 'missionVision',
      type: 'group',
      label: 'Mission Vision Section',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Alumni Advisors & Executive' },
        { name: 'description', type: 'textarea', localized: true, defaultValue: 'Our purpose and aspirations for the future of robotics education' },
      ],
    },
    {
      name: 'partners',
      type: 'group',
      label: 'Partners Section',
      fields: [
        { name: 'title', type: 'text', localized: true, defaultValue: 'Trusted by Industry Leaders' },
      ],
    },
  ],
}
