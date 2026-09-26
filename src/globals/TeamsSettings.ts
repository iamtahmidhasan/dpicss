import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const TeamsSettings: GlobalConfig = {
  slug: 'teams-settings',
  label: 'Teams Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'Teams' },
    { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Meet the teams behind DPI Robotics Club innovations and projects.' },
    { name: 'empty', type: 'textarea', localized: true, defaultValue: 'No teams published yet.' },
    { name: 'emptyDescription', type: 'textarea', localized: true, defaultValue: 'Please check back soon for team updates.' },
    { name: 'backToTeams', type: 'text', localized: true, defaultValue: 'Back to all teams' },
    { name: 'members', type: 'text', localized: true, defaultValue: '{count} Members' },
    { name: 'featured', type: 'text', localized: true, defaultValue: 'Featured' },
    { name: 'established', type: 'text', localized: true, defaultValue: 'Established' },
    { name: 'noMembers', type: 'textarea', localized: true, defaultValue: 'No members assigned to this team yet.' },
    { name: 'viewTeam', type: 'text', localized: true, defaultValue: 'View Team' },
    { name: 'viewProfile', type: 'text', localized: true, defaultValue: 'View Profile' },
  ],
}
