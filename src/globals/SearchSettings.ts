import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const SearchSettings: GlobalConfig = {
  slug: 'search-settings',
  label: 'Search Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'Search' },
    { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Find members, courses, and posts quickly.' },
    { name: 'fieldLabel', type: 'text', localized: true, defaultValue: 'Search' },
    { name: 'placeholder', type: 'text', localized: true, defaultValue: 'Type to search…' },
    { name: 'submit', type: 'text', localized: true, defaultValue: 'Search' },
    { name: 'hintEmpty', type: 'textarea', localized: true, defaultValue: 'Type a keyword to search the site.' },
    { name: 'membersHeading', type: 'text', localized: true, defaultValue: 'Members ({n})' },
    { name: 'coursesHeading', type: 'text', localized: true, defaultValue: 'Courses ({n})' },
    { name: 'postsHeading', type: 'text', localized: true, defaultValue: 'Posts ({n})' },
    { name: 'noMembers', type: 'text', localized: true, defaultValue: 'No matching members found.' },
    { name: 'noCourses', type: 'text', localized: true, defaultValue: 'No matching courses found.' },
    { name: 'noPosts', type: 'text', localized: true, defaultValue: 'No matching posts found.' },
    { name: 'unnamedMember', type: 'text', localized: true, defaultValue: 'Unnamed member' },
    { name: 'untitledCourse', type: 'text', localized: true, defaultValue: 'Untitled course' },
  ],
}
