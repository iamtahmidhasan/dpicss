import type { CollectionAfterChangeHook } from 'payload'
import { sendContactReplyEmail } from '../lib/mail'

export const sendContactReply: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'update') return
  if (context?.skipContactReplyEmail) return
  if ((req as any)?.context?.skipContactReplyEmail) return

  const currentReply = (doc as any)?.reply
  const previousReply = (previousDoc as any)?.reply

  if (!currentReply || currentReply === previousReply) return

  const email = (doc as any)?.email
  const name = (doc as any)?.name
  const subject = (doc as any)?.subject

  if (!email) {
    console.warn('[ContactReply] No email address found for submission')
    return
  }

  try {
    await sendContactReplyEmail({
      to: email,
      name: name || 'there',
      originalSubject: subject || 'Your inquiry',
      replyMessage: currentReply,
    })

    console.info(`[ContactReply] Reply sent to ${email}`)

    const currentStatus = (doc as any)?.status
    if (currentStatus !== 'replied') {
      await req.payload.update({
        collection: 'contact-submissions' as any,
        id: doc.id,
        data: {
          status: 'replied',
          repliedAt: new Date().toISOString(),
        },
        context: { skipActivityTracking: true, skipContactReplyEmail: true },
        req,
      })

      console.info(`[ContactReply] Status updated to replied for submission ${doc.id}`)
    }
  } catch (error) {
    console.error('[ContactReply] Failed to send reply email:', error)
  }
}