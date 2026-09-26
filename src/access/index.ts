import type { Access, FieldAccess, PayloadRequest } from 'payload'

export { isAdmin, isAdminOrInstructor } from './roles'

// Anyone can read
export const anyone: Access = () => true

// Only authenticated users
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Admin only (users with admin role)
export const adminOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin') || false
}

// Admin or self (for user profiles)
export const adminOrSelf: Access = ({ req: { user }, id }) => {
  if (user?.roles?.includes('admin')) return true
  return { id: { equals: user?.id } }
}

// Published content only
export const publishedOnly: Access = () => ({
  _status: { equals: 'published' },
})

// Authenticated or published
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

// Instructor or admin
export const instructorOrAdmin: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  if (user?.roles?.includes('instructor')) return true
  return false
}

// Editor only (content creators)
export const editorOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('editor') || user?.roles?.includes('admin') || false
}

// Editor and above (editor and admin)
export const editorAndAbove: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  if (user?.roles?.includes('editor')) return true
  return false
}

// Members cannot access admin - deny all for regular members
export const membersCannotAccess: Access = ({ req: { user } }) => {
  if (!user) return false

  const isPrivileged =
    user.roles?.includes('admin') ||
    user.roles?.includes('editor') ||
    user.roles?.includes('instructor')

  if (isPrivileged) {
    return true
  }

  const isMemberFamilyRole =
    user.roles?.includes('member') ||
    user.roles?.includes('official_member') ||
    user.roles?.includes('unofficial_member')

  if (isMemberFamilyRole) {
    return false
  }

  return false
}

/** Allow unauthenticated users to reach the admin login screen; gate the dashboard for member roles. */
export const adminPanelAccess = ({ req }: { req: PayloadRequest }): boolean | Promise<boolean> => {
  if (!req.user) return true
  const allowed = membersCannotAccess({ req })
  return allowed === true
}

// Instructors can only edit their own courses
export const instructorCourseAccess: Access = async ({ req: { user, payload }, id }) => {
  if (user?.roles?.includes('admin')) return true

  if (!user?.roles?.includes('instructor')) return false

  if (!id) return false

  try {
    const course = await payload.findByID({
      collection: 'courses',
      id: id as string,
      depth: 0,
      overrideAccess: true,
    })

    if (!(course as any)?.instructors) return false

    const instructorIds = (course as any).instructors as string[]
    if (!instructorIds?.length) return false

    const member = await payload.find({
      collection: 'members',
      where: { user: { equals: user.id } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    const memberId = member.docs[0]?.id
    if (!memberId) return false

    return instructorIds.includes(memberId)
  } catch {
    return false
  }
}

// Field-level: Only admins can edit sensitive user fields
export const adminOnlyField: FieldAccess = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}

// Field-level: User can read their own field, admin can read/update all
export const selfOrAdminField: FieldAccess = ({ req: { user }, id }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return user.id === id
}

// Field-level: Don't allow editors to edit user/member info
export const protectedFieldFromEditors: FieldAccess = ({ req: { user } }) => {
  // Only admins can edit
  if (user?.roles?.includes('admin')) return true
  return false
}
