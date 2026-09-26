import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const AchievementsSettings: GlobalConfig = {
  slug: 'achievements-settings',
  label: 'Achievements Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'Achievements' },
    { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Milestones, awards, and competition highlights from DPI Robotics Club.' },
    { name: 'empty', type: 'textarea', localized: true, defaultValue: 'No achievements published yet.' },
    { name: 'untitled', type: 'text', localized: true, defaultValue: 'Untitled Achievement' },
    { name: 'featured', type: 'text', localized: true, defaultValue: 'Featured' },
    { name: 'unknownDate', type: 'text', localized: true, defaultValue: 'Date not provided' },
    { name: 'noSummary', type: 'textarea', localized: true, defaultValue: 'Summary not available yet.' },
    { name: 'viewDetails', type: 'text', localized: true, defaultValue: 'View details' },
    { name: 'backToList', type: 'text', localized: true, defaultValue: '← Back to all achievements' },
    { name: 'badgeLabel', type: 'text', localized: true, defaultValue: 'Achievement' },
    { name: 'noContent', type: 'textarea', localized: true, defaultValue: 'No detailed content available for this achievement yet.' },
    { name: 'galleryTitle', type: 'text', localized: true, defaultValue: 'Gallery' },
    { name: 'detailsTitle', type: 'text', localized: true, defaultValue: 'Achievement Details' },
    { name: 'dateLabel', type: 'text', localized: true, defaultValue: 'Date' },
    { name: 'venueLabel', type: 'text', localized: true, defaultValue: 'Venue' },
    { name: 'organizerLabel', type: 'text', localized: true, defaultValue: 'Organizer' },
    { name: 'recognitionLabel', type: 'text', localized: true, defaultValue: 'Recognition' },
    { name: 'notProvided', type: 'text', localized: true, defaultValue: 'Not provided' },
  ],
}
