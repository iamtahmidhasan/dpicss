import { sendComplaintReceivedEmail } from '../lib/mail'
import { formatMemberFullName } from '../lib/member-name'

type ComplaintItem = {
  message?: string | null
  createdAt?: string | null
}

type ComplaintDoc = {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  complaints?: ComplaintItem[] | null
}

function getComplaints(input: ComplaintDoc | undefined | null): ComplaintItem[] {
  if (!input?.complaints || !Array.isArray(input.complaints)) return []
  return input.complaints
}

export async function notifyComplaintReceived({
  doc,
  previousDoc,
}: {
  doc: ComplaintDoc
  previousDoc?: ComplaintDoc | null
}): Promise<void> {
  if (!previousDoc) return

  const before = getComplaints(previousDoc)
  const after = getComplaints(doc)

  if (after.length <= before.length) return

  const latest = after[after.length - 1]
  const message = typeof latest?.message === 'string' ? latest.message.trim() : ''
  if (!message) return

  const email = typeof doc.email === 'string' ? doc.email.trim() : ''
  if (!email) return

  const name = formatMemberFullName(doc.firstName || undefined, doc.lastName || undefined)

  await sendComplaintReceivedEmail({
    to: email,
    name: name || email.split('@')[0] || 'there',
    message,
  })
}
