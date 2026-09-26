import type { Access } from 'payload'

const hasRole = (user: { roles?: string[] } | null | undefined, role: string) =>
  Boolean(user?.roles?.includes(role))

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

export const isAdminOrInstructor: Access = ({ req: { user } }) =>
  hasRole(user, 'admin') || hasRole(user, 'instructor')
