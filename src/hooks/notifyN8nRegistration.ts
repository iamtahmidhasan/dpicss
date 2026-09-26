import type { CollectionAfterChangeHook } from 'payload'
import { buildMemberWebhookPayload, sendMemberWebhook } from '../lib/n8n-webhook'

/**
 * Sends full member data to n8n on every create or update.
 * Webhook failures are logged but never block the operation.
 */
export const notifyN8nRegistration: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' && operation !== 'update') return doc

  const payload = buildMemberWebhookPayload(
    doc as unknown as Record<string, unknown>,
    operation === 'create' ? 'created' : 'updated',
  )

  await sendMemberWebhook(payload, req.payload.logger)

  return doc
}
