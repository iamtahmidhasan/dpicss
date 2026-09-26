import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const PostsSettings: GlobalConfig = {
  slug: 'posts-settings',
  label: 'Posts Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'Posts' },
    { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Latest updates, tutorials, and news from DPICS.' },
    { name: 'empty', type: 'textarea', localized: true, defaultValue: 'No posts published yet.' },
    { name: 'untitled', type: 'text', localized: true, defaultValue: 'Untitled Post' },
    { name: 'postImageAlt', type: 'text', localized: true, defaultValue: 'Post image' },
    { name: 'minRead', type: 'text', localized: true, defaultValue: '{m} min read' },
    { name: 'quickRead', type: 'text', localized: true, defaultValue: 'Quick read' },
  ],
}
