import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

const RECENT_ACTIVITY_TTL_MS = Number(process.env.ACTIVITY_DEDUPE_TTL_MS || 500)
const recentActivityMap = new Map<string, number>()

function isRecentlyTracked(key: string): boolean {
  const now = Date.now()
  const last = recentActivityMap.get(key)
  if (typeof last === 'number' && now - last < RECENT_ACTIVITY_TTL_MS) {
    return true
  }

  recentActivityMap.set(key, now)

  // Opportunistic cleanup to keep map bounded.
  for (const [k, ts] of recentActivityMap.entries()) {
    if (now - ts > RECENT_ACTIVITY_TTL_MS * 4) {
      recentActivityMap.delete(k)
    }
  }

  return false
}

/**
 * Hook to track all document changes/activities
 * Prevents infinite loops using context flags
 */
export const trackActivity: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
  context,
}) => {
  // Skip if already tracking this operation (prevent infinite loops)
  if (context?.skipActivityTracking) return
  if (
    (req as PayloadRequest & { context?: { skipActivityTracking?: boolean } }).context
      ?.skipActivityTracking
  ) {
    return
  }

  // Get collection slug safely (Payload attaches this internally)
  const collectionSlug = (req as PayloadRequest & { collection?: string }).collection
  if (collectionSlug === 'activities') return

  // Defensive fallback: if doc itself looks like an activity record, never track it again.
  if (doc && typeof doc === 'object' && 'collectionName' in doc && 'action' in doc) {
    return
  }

  const dedupeKey = `${collectionSlug || 'unknown'}:${operation}:${String(doc?.id || 'unknown')}`
  if (isRecentlyTracked(dedupeKey)) return

  try {
    const typedDoc = (doc && typeof doc === 'object' ? doc : {}) as Record<string, unknown>
    const typedPrevious =
      previousDoc && typeof previousDoc === 'object' ? (previousDoc as Record<string, unknown>) : {}

    // Determine what changed
    const changes: Record<string, { old?: unknown; new?: unknown }> = {}

    if (operation === 'create') {
      // For create, store the full new document
      Object.keys(typedDoc).forEach((key) => {
        if (!key.startsWith('_')) {
          changes[key] = {
            new: typedDoc[key],
          }
        }
      })
    } else if (operation === 'update' && previousDoc) {
      // For update, store old and new values
      Object.keys(typedDoc).forEach((key) => {
        if (typedDoc[key] !== typedPrevious[key] && !key.startsWith('_')) {
          changes[key] = {
            old: typedPrevious[key],
            new: typedDoc[key],
          }
        }
      })
    }

    // Create activity log with context flag to prevent recursive tracking
    await req.payload.create({
      collection: 'activities',
      data: {
        user: req.user?.id,
        action: operation,
        collectionName: collectionSlug || 'unknown',
        documentId: doc.id,
        documentTitle:
          (typeof typedDoc.title === 'string' && typedDoc.title) ||
          (typeof typedDoc.name === 'string' && typedDoc.name) ||
          (typeof typedDoc.email === 'string' && typedDoc.email) ||
          doc.id,
        changes,
        ipAddress: (req as PayloadRequest & { ip?: string }).ip || 'unknown',
        userAgent:
          (req as PayloadRequest & { headers?: Headers }).headers
            ?.get?.('user-agent')
            ?.toString() || 'unknown',
        status: 'success',
      },
      overrideAccess: true, // System records should bypass access control
      context: { skipActivityTracking: true }, // ✅ Prevent recursive tracking
      req, // ✅ Ensure transaction safety
    })
  } catch (error) {
    console.error('Error tracking activity:', error)
    // Don't throw - we don't want activity tracking failures to break the main operation
  }
}
