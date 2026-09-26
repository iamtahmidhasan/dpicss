import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrInstructor } from '../access'
import { invalidateCollectionCache } from '../lib/cache/optimized-fetch'
import { pickLocalizedString } from '../lib/localized-string'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'createdAt'],
    group: 'Projects',
  },
  indexes: [
    { fields: ['status'] },
    { fields: ['category'] },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return { status: { equals: 'published' } }
    },
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'update' || operation === 'create') {
          await invalidateCollectionCache('projects')
        }
        return doc
      },
    ],
    afterDelete: [
      async () => {
        await invalidateCollectionCache('projects')
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier',
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Brief summary for cards and previews',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Detailed project description with features, goals, and outcomes',
      },
    },

    // ── Media ──────────────────────────────────────────────────────────────
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Project cover image (recommended: 1280×720px)',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
      admin: {
        description: 'Project images gallery',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      localized: true,
      admin: {
        description: 'Demo video YouTube/Vimeo URL',
        placeholder: 'https://www.youtube.com/watch?v=...',
      },
    },

    // ── Project Details ──────────────────────────────────────────────────────────────
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Competition Robot', value: 'competition' },
        { label: 'Research', value: 'research' },
        { label: 'Education', value: 'education' },
        { label: 'Automation', value: 'automation' },
        { label: 'IoT & Smart Systems', value: 'iot' },
        { label: 'AI & Machine Learning', value: 'ai-ml' },
        { label: 'Drones', value: 'drones' },
        { label: 'Prototyping', value: 'prototyping' },
      ],
    },
    {
      name: 'technologies',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
      admin: {
        description: 'Technologies used (Arduino, Raspberry Pi, Python, ROS, etc.)',
      },
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
      admin: {
        description: 'Key features of the project',
      },
    },
    {
      name: 'githubUrl',
      type: 'text',
      admin: {
        description: 'GitHub repository URL',
        placeholder: 'https://github.com/username/repo',
      },
    },
    {
      name: 'documentationUrl',
      type: 'text',
      admin: {
        description: 'Documentation or wiki URL',
      },
    },
    {
      name: 'demoUrl',
      type: 'text',
      admin: {
        description: 'Live demo URL',
      },
    },

    // ── Team ──────────────────────────────────────────────────────────────
    {
      name: 'teamMembers',
      type: 'array',
      fields: [
        {
          name: 'member',
          type: 'relationship',
          relationTo: 'members',
        },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Team Leader', value: 'lead' },
            { label: 'Hardware', value: 'hardware' },
            { label: 'Software', value: 'software' },
            { label: 'Mechanical', value: 'mechanical' },
            { label: 'Designer', value: 'designer' },
            { label: 'Documentation', value: 'docs' },
          ],
        },
      ],
      admin: {
        description: 'Team members and their roles',
      },
    },

    // ── Timeline ──────────────────────────────────────────────────────────────
    {
      name: 'startDate',
      type: 'date',
      admin: {
        description: 'Project start date',
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        description: 'Project completion date',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Published', value: 'published' },
        { label: 'Completed', value: 'completed' },
        { label: 'On Hold', value: 'on-hold' },
      ],
    },

    // ── Awards ──────────────────────────────────────────────────────────────
    {
      name: 'awards',
      type: 'array',
      fields: [
        {
          name: 'competition',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'position',
          type: 'text',
          localized: true,
        },
        {
          name: 'year',
          type: 'text',
        },
      ],
      admin: {
        description: 'Competition awards and achievements',
      },
    },

    // ── Metadata ──────────────────────────────────────────────────────────────
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feature on homepage',
      },
    },
  ],
  timestamps: true,
}