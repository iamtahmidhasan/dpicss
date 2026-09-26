import type { ArrayField, GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

const keyedLocalizedFields = (
  fieldName: string,
  defaults: Record<string, { en: string; bn: string }>,
): ArrayField => ({
  name: fieldName,
  type: 'array',
  label:
    fieldName === 'categories'
      ? 'Categories'
      : fieldName === 'status'
        ? 'Statuses'
        : 'Team roles',
  admin: {
    description: 'Key must match the value stored on project documents.',
  },
  fields: [
    { name: 'key', type: 'text', required: true },
    { name: 'label', type: 'text', localized: true, required: true },
  ],
  defaultValue: Object.entries(defaults).map(([key, { en }]) => ({ key, label: en })) as any,
})

export const ProjectsSettings: GlobalConfig = {
  slug: 'projects-settings',
  label: 'Projects Page',
  access: {
    read: anyone,
    update: adminOnly,
  },
  admin: {
    group: 'Pages',
  },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'Projects' },
    { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'Explore our software and automation projects' },
    { name: 'featured', type: 'text', localized: true, defaultValue: 'Featured Projects' },
    { name: 'all', type: 'text', localized: true, defaultValue: 'All Projects' },
    { name: 'noProjects', type: 'text', localized: true, defaultValue: 'No projects found.' },
    { name: 'untitled', type: 'text', localized: true, defaultValue: 'Untitled' },
    { name: 'projectImageAlt', type: 'text', localized: true, defaultValue: 'Project' },
    { name: 'overview', type: 'text', localized: true, defaultValue: 'Overview' },
    { name: 'gallery', type: 'text', localized: true, defaultValue: 'Gallery' },
    { name: 'team', type: 'text', localized: true, defaultValue: 'Team' },
    { name: 'detail', type: 'text', localized: true, defaultValue: 'Project Details' },
    { name: 'technologies', type: 'text', localized: true, defaultValue: 'Technologies' },
    { name: 'features', type: 'text', localized: true, defaultValue: 'Features' },
    { name: 'awards', type: 'text', localized: true, defaultValue: 'Awards & Achievements' },
    { name: 'github', type: 'text', localized: true, defaultValue: 'GitHub' },
    { name: 'documentation', type: 'text', localized: true, defaultValue: 'Documentation' },
    { name: 'demo', type: 'text', localized: true, defaultValue: 'Live Demo' },
    { name: 'startDate', type: 'text', localized: true, defaultValue: 'Started' },
    { name: 'endDate', type: 'text', localized: true, defaultValue: 'Completed' },
    { name: 'noBio', type: 'text', localized: true, defaultValue: 'No bio available.' },
    keyedLocalizedFields('categories', {
      competition: { en: 'Competition Project', bn: 'প্রতিযোগিতা প্রকল্প' },
      research: { en: 'Research', bn: 'গবেষণা' },
      education: { en: 'Education', bn: 'শিক্ষা' },
      automation: { en: 'Automation', bn: 'অটোমেশন' },
      iot: { en: 'IoT & Smart Systems', bn: 'আইওটি ও স্মার্ট সিস্টেম' },
      'ai-ml': { en: 'AI & Machine Learning', bn: 'এআই ও মেশিন লার্নিং' },
      drones: { en: 'Drones', bn: 'ড্রোন' },
      prototyping: { en: 'Prototyping', bn: 'প্রোটোটাইপিং' },
    }),
    keyedLocalizedFields('status', {
      draft: { en: 'Draft', bn: 'খসডা' },
      inProgress: { en: 'In Progress', bn: 'চলছে' },
      completed: { en: 'Completed', bn: 'সম্পন্ন' },
      onHold: { en: 'On Hold', bn: 'অপেক্ষায়' },
    }),
    keyedLocalizedFields('roles', {
      lead: { en: 'Team Leader', bn: 'টিম লিডার' },
      hardware: { en: 'Hardware', bn: 'হার্ডওয়্যার' },
      software: { en: 'Software', bn: 'সফটওয়্যার' },
      mechanical: { en: 'Mechanical', bn: 'মেকানিক্যাল' },
      designer: { en: 'Designer', bn: 'ডিজাইনার' },
      docs: { en: 'Documentation', bn: 'ডকুমেন্টেশন' },
    }),
  ],
}
