import type { FieldHook } from 'payload'
import { updateMediaUsage } from '../utilities/mediaUtils'

/**
 * Hook to track media usage when assets are referenced
 */
export const trackMediaUsage: FieldHook = async ({ value, previousValue, req, operation }) => {
  // Only track on update operations
  if (operation !== 'update') return value

  try {
    // Handle single media reference
    if (typeof value === 'string' && value !== previousValue) {
      if (previousValue) {
        await updateMediaUsage(req.payload, previousValue, 'decrement', req)
      }
      if (value) {
        await updateMediaUsage(req.payload, value, 'increment', req)
      }
    }

    // Handle array of media references
    if (Array.isArray(value)) {
      const previousIds = Array.isArray(previousValue)
        ? previousValue
            .map((item: any) => (typeof item === 'string' ? item : item?.id))
            .filter(Boolean)
        : []

      const currentIds = value
        .map((item: any) => (typeof item === 'string' ? item : item?.id))
        .filter(Boolean)

      // Decrement usage for removed items
      const removedIds = previousIds.filter((id) => !currentIds.includes(id))
      for (const id of removedIds) {
        await updateMediaUsage(req.payload, id, 'decrement', req)
      }

      // Increment usage for added items
      const addedIds = currentIds.filter((id) => !previousIds.includes(id))
      for (const id of addedIds) {
        await updateMediaUsage(req.payload, id, 'increment', req)
      }
    }
  } catch {
    // Silently fail - media tracking is not critical
  }

  return value
}
