import nodemailer from 'nodemailer'

/** TLS options shared by buildSmtpTransport (and documented for operators). */
export function smtpTlsOptions(): {
  minVersion: 'TLSv1.2'
  rejectUnauthorized: boolean
  servername?: string
} {
  const rejectUnauthorized =
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED?.trim().toLowerCase() !== 'false'
  const servername = process.env.SMTP_TLS_SERVERNAME?.trim() || undefined
  return {
    minVersion: 'TLSv1.2',
    rejectUnauthorized,
    ...(servername ? { servername } : {}),
  }
}

function parseSmtpPort(raw: string | undefined): number | null {
  if (raw == null || raw === '') return null
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 && n <= 65535 ? n : null
}

export type SmtpEnvSummary = {
  host?: string
  port?: number
  from?: string
  hasAuth: boolean
}

export function getSmtpEnvSummary(): SmtpEnvSummary {
  const host = process.env.SMTP_HOST?.trim()
  const port = parseSmtpPort(process.env.SMTP_PORT)
  const from = process.env.SMTP_FROM?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  return {
    host: host || undefined,
    port: port ?? undefined,
    from: from || undefined,
    hasAuth: Boolean(user && pass),
  }
}

/**
 * Builds a nodemailer transport from env.
 * - Port 465: implicit TLS (`secure: true`) unless SMTP_SECURE=false
 * - Port 587 / 2587: STARTTLS (`secure: false`, `requireTLS: true`) unless SMTP_SECURE=true
 * - Set SMTP_SECURE=true|false to override port heuristics (e.g. some hosts use 465 without TLS wrapper)
 */
export function buildSmtpTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST?.trim()
  const port = parseSmtpPort(process.env.SMTP_PORT)
  const from = process.env.SMTP_FROM?.trim()
  if (!host || !port || !from) return null

  const user = process.env.SMTP_USER?.trim() || undefined
  const pass = process.env.SMTP_PASS?.trim() || undefined
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase()

  let secure: boolean
  if (secureRaw === 'true') {
    secure = true
  } else if (secureRaw === 'false') {
    secure = false
  } else {
    secure = port === 465
  }

  const useStartTls = !secure && (port === 587 || port === 2587 || port === 2525)

  const tls = smtpTlsOptions()

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    requireTLS: useStartTls,
    connectionTimeout: 20_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    tls,
  })
}

/** @deprecated use buildSmtpTransport */
export function createMailTransport(): nodemailer.Transporter | null {
  return buildSmtpTransport()
}

export type SendOtpEmailResult =
  | { ok: true; channel: 'smtp'; messageId?: string }
  | { ok: true; channel: 'console' }
  | { ok: false; channel: 'smtp'; code?: string; detail: string }

/**
 * Sends signup / resend OTP. Does not throw.
 * If SMTP is not configured, logs the OTP to the server console and succeeds (legacy dev behavior).
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  expiryMinutes: number,
): Promise<SendOtpEmailResult> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()

  if (!transporter || !from) {
    console.warn(
      `[OTP] SMTP not configured (set SMTP_HOST, SMTP_PORT, SMTP_FROM). OTP for ${to}: ${otp}`,
    )
    return { ok: true, channel: 'console' }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Your verification code',
      text: `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
    })
    return { ok: true, channel: 'smtp', messageId: info.messageId }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { responseCode?: number; response?: string }
    const code = e.code ?? (e.responseCode != null ? String(e.responseCode) : undefined)
    let detail = [e.message, e.response].filter(Boolean).join(' — ') || 'Unknown SMTP error'
    if (
      /self[- ]signed certificate|unable to verify the first certificate|UNABLE_TO_VERIFY_LEAF_SIGNATURE/i.test(
        detail,
      )
    ) {
      detail +=
        ' — TLS verification failed. On Windows or behind SSL-inspecting antivirus/proxy, set SMTP_TLS_REJECT_UNAUTHORIZED=false for local dev only, or add your root CA via NODE_EXTRA_CA_CERTS.'
    }
    console.error('[OTP] sendMail failed', { to, code, detail })
    return { ok: false, channel: 'smtp', code, detail }
  }
}

export async function sendMemberWelcomeEmail(to: string, firstName: string): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()
  if (!transporter || !from) {
    console.warn(`[Mail] Welcome email skipped (SMTP not configured) for ${to}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
  const name = firstName?.trim() || 'there'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Welcome to DPI Computing Society — your official profile is approved',
      text: `Hi ${name},\n\nYour official member profile has been approved and is now listed in the member directory.\n\nVisit: ${appUrl}/members\n\nCreate your shareable poster: ${appUrl}/account?tab=poster\n\n— DPI Computing Society`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px">Hi ${name}!</h2>
          <p style="margin:0 0 12px">Your official member profile has been approved and is now listed in the member directory.</p>
          <p style="margin:0 0 16px">
            <a href="${appUrl}/members" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View Directory</a>
          </p>
          <div style="margin:20px 0;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e">
            <p style="margin:0 0 8px;font-weight:bold">🎉 Share Your Achievement</p>
            <p style="margin:0;font-size:14px">Create your personalised shareable poster and let everyone know you're part of DPI Computing Society.</p>
            <p style="margin:8px 0 0">
              <a href="${appUrl}/account?tab=poster" style="color:#2563eb;text-decoration:none;font-weight:bold">Create Your Poster →</a>
            </p>
          </div>
          <p style="margin:0;color:#6b7280">— DPI Computing Society</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Welcome email failed', to, err)
  }
}

export type SendAnnouncementEmailResult =
  | { ok: true; channel: 'smtp'; messageId?: string }
  | { ok: true; channel: 'console' }
  | { ok: false; channel: 'smtp'; code?: string; detail: string }

export async function sendAnnouncementEmail({
  to,
  subject,
  title,
  summary,
  actionUrl,
}: {
  to: string
  subject: string
  title: string
  summary?: string
  actionUrl: string
}): Promise<SendAnnouncementEmailResult> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()

  if (!transporter || !from) {
    console.warn(`[Mail] Announcement email skipped (SMTP not configured) for ${to}`)
    return { ok: true, channel: 'console' }
  }

  const safeSummary = summary?.trim() || ''
  const text = `${title}\n\n${safeSummary}\n\nRead the announcement: ${actionUrl}\n\n— DPI Computing Society`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px">${title}</h2>
      ${safeSummary ? `<p style="margin:0 0 16px">${safeSummary}</p>` : ''}
      <p style="margin:0 0 16px">
        <a href="${actionUrl}" style="color:#2563eb;text-decoration:none">Read the announcement</a>
      </p>
      <p style="margin:0;color:#6b7280">— DPI Computing Society</p>
    </div>
  `.trim()

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    })
    return { ok: true, channel: 'smtp', messageId: info.messageId }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { responseCode?: number; response?: string }
    const code = e.code ?? (e.responseCode != null ? String(e.responseCode) : undefined)
    const detail = [e.message, e.response].filter(Boolean).join(' — ') || 'Unknown SMTP error'
    console.error('[Mail] Announcement send failed', { to, code, detail })
    return { ok: false, channel: 'smtp', code, detail }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<{ messageId?: string }> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()
  if (!transporter || !from) {
    throw new Error('SMTP is not configured (SMTP_HOST, SMTP_PORT, SMTP_FROM required)')
  }

  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
  const resetURL = `${appUrl}/reset-password`

  const info = await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset your password',
    text: `Reset code: ${token}\n\nEnter this code at: ${resetURL}\n\nThis code expires in 1 hour.`,
  })
  return { messageId: info.messageId }
}

export async function sendComplaintReceivedEmail({
  to,
  name,
  message,
}: {
  to: string
  name: string
  message: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()
  if (!transporter || !from) {
    console.warn(`[Mail] Complaint email skipped (SMTP not configured) for ${to}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
  const safeName = name.trim() || 'there'
  const safeMessage = message.trim()

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'We received your complaint',
      text: `Hi ${safeName},\n\nWe received your complaint and our team will review it shortly.\n\nYour message:\n${safeMessage}\n\nYou can visit your account for updates: ${appUrl}/account?tab=complaints\n\n— DPI Computing Society`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <p>Hi ${safeName},</p>
          <p>We received your complaint and our team will review it shortly.</p>
          <div style="margin:16px 0;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb">
            <p style="margin:0;white-space:pre-wrap">${safeMessage}</p>
          </div>
          <p>
            View status in your account: <a href="${appUrl}/account?tab=complaints">${appUrl}/account</a>
          </p>
          <p style="color:#6b7280">— DPI Computing Society</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Complaint email failed', to, err)
  }
}

export async function sendContactEmail({
  to,
  fromName,
  fromEmail,
  subject,
  message,
  phone,
}: {
  to: string
  fromName: string
  fromEmail: string
  subject: string
  message: string
  phone?: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()
  if (!transporter || !from) {
    console.warn(`[Mail] Contact email skipped (SMTP not configured) for ${to}`)
    return
  }

  const safeName = fromName.trim() || 'Unknown'
  const safeMessage = message.trim()
  const safePhone = phone?.trim() || 'Not provided'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `[Contact Form] ${subject}`,
      text: `New contact form submission\n\nName: ${safeName}\nEmail: ${fromEmail}\nPhone: ${safePhone}\nSubject: ${subject}\n\nMessage:\n${safeMessage}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px;color:#111">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;font-weight:bold;width:100px">Name:</td>
              <td style="padding:8px 0">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:bold">Email:</td>
              <td style="padding:8px 0"><a href="mailto:${fromEmail}">${fromEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:bold">Phone:</td>
              <td style="padding:8px 0">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:bold">Subject:</td>
              <td style="padding:8px 0">${subject}</td>
            </tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px">
            <p style="margin:0;font-weight:bold">Message:</p>
            <p style="margin:8px 0 0;white-space:pre-wrap">${safeMessage}</p>
          </div>
          <p style="margin-top:16px;color:#6b7280">— DPI Computing Society Contact Form</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Contact email failed', to, err)
  }
}

export async function sendContactConfirmationEmail({
  to,
  name,
  subject,
}: {
  to: string
  name: string
  subject: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()
  if (!transporter || !from) {
    console.warn(`[Mail] Contact confirmation email skipped (SMTP not configured) for ${to}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
  const safeName = name.trim() || 'there'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'We received your message',
      text: `Hi ${safeName},\n\nWe received your message regarding "${subject}". Our team will review it and get back to you soon.\n\nThank you for reaching out!\n\n— DPI Computing Society`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px">Hi ${safeName}!</h2>
          <p style="margin:0 0 12px">We received your message regarding <strong>"${subject}"</strong>. Our team will review it and get back to you soon.</p>
          <p style="margin:0">Thank you for reaching out!</p>
          <p style="margin-top:16px;color:#6b7280">— DPI Computing Society</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Contact confirmation email failed', to, err)
  }
}

export async function sendContactReplyEmail({
  to,
  name,
  originalSubject,
  replyMessage,
}: {
  to: string
  name: string
  originalSubject: string
  replyMessage: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()
  if (!transporter || !from) {
    console.warn(`[Mail] Contact reply email skipped (SMTP not configured) for ${to}`)
    return
  }

  const safeName = name.trim() || 'there'
  const safeReply = replyMessage.trim()
  const safeOriginalSubject = originalSubject.trim()

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Re: ${safeOriginalSubject}`,
      text: `Hi ${safeName},\n\nThank you for contacting DPI Computing Society. Here is our reply:\n\n${safeReply}\n\nIf you have any more questions, please don't hesitate to reach out.\n\nBest regards,\nDPI Computing Society Team`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px">Hi ${safeName}!</h2>
          <p style="margin:0 0 12px">Thank you for contacting DPI Computing Society. Here is our reply:</p>
          <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #2563eb">
            <p style="margin:0;white-space:pre-wrap">${safeReply}</p>
          </div>
          <p style="margin:0 0 12px">If you have any more questions, please don't hesitate to reach out.</p>
          <p style="margin:0;color:#6b7280">Best regards,<br>DPI Computing Society Team</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Contact reply email failed', to, err)
  }
}

export async function sendEnrollmentApprovedEmail({
  to,
  courseTitle,
  courseUrl,
}: {
  to: string
  courseTitle: string
  courseUrl: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()

  if (!transporter || !from) {
    console.warn(`[Mail] Enrollment approved email skipped (SMTP not configured) for ${to}`)
    return
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `You're enrolled in ${courseTitle}!`,
      text: `Congratulations! Your enrollment request for "${courseTitle}" has been approved.\n\nYou can now access the course content and start learning.\n\nVisit your courses: ${courseUrl}\n\nHappy learning!\n— DPI Computing Society`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px">🎉 You're enrolled!</h2>
          <p style="margin:0 0 12px">Your enrollment request for <strong>${courseTitle}</strong> has been approved.</p>
          <p style="margin:0 0 16px">You can now access the course content and start learning.</p>
          <p style="margin:0 0 16px">
            <a href="${courseUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Start Learning</a>
          </p>
          <p style="margin:0;color:#6b7280">Happy learning!<br>— DPI Computing Society Team</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Enrollment approved email failed', to, err)
  }
}

export async function sendEnrollmentRequestSubmittedEmail({
  to,
  courseTitle,
  studentName,
}: {
  to: string
  courseTitle: string
  studentName: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()

  if (!transporter || !from) {
    console.warn(
      `[Mail] Enrollment request submitted email skipped (SMTP not configured) for ${to}`,
    )
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
  const safeName = studentName?.trim() || 'there'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Enrollment request received for ${courseTitle}`,
      text: `Hi ${safeName},\n\nWe received your enrollment request for "${courseTitle}".\n\nYour request is currently under review and will be processed within 24-48 hours.\n\nYou will receive an email notification once your enrollment is approved.\n\nTrack your enrollments: ${appUrl}/account\n\n— DPI Computing Society`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px">Hi ${safeName}!</h2>
          <p style="margin:0 0 12px">We received your enrollment request for <strong>${courseTitle}</strong>.</p>
          <p style="margin:0 0 16px">Your request is currently <strong>under review</strong> and will be processed within <strong>24-48 hours</strong>.</p>
          <div style="margin:16px 0;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e">
            <p style="margin:0 0 8px;font-weight:bold">What happens next?</p>
            <ul style="margin:0;padding-left:20px">
              <li>Admin will review your payment details</li>
              <li>You will receive an email upon approval</li>
              <li>Check your account for status updates</li>
            </ul>
          </div>
          <p style="margin:0 0 16px">
            <a href="${appUrl}/account" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View My Enrollments</a>
          </p>
          <p style="margin:0;color:#6b7280">— DPI Computing Society Team</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Enrollment request submitted email failed', to, err)
  }
}

export async function sendEnrollmentStatusUpdateEmail({
  to,
  courseTitle,
  studentName,
  newStatus,
  adminNotes,
}: {
  to: string
  courseTitle: string
  studentName: string
  newStatus: 'active' | 'pending' | 'suspended' | 'completed' | 'revoked' | 'rejected'
  adminNotes?: string
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim()
  const transporter = buildSmtpTransport()

  if (!transporter || !from) {
    console.warn(`[Mail] Enrollment status update email skipped (SMTP not configured) for ${to}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
  const safeName = studentName?.trim() || 'there'

  const statusConfig: Record<
    string,
    { subject: string; emoji: string; color: string; message: string }
  > = {
    active: {
      subject: `You're enrolled in ${courseTitle}!`,
      emoji: '🎉',
      color: '#22c55e',
      message:
        'Your enrollment has been approved! You can now access the course and start learning.',
    },
    pending: {
      subject: `Enrollment review restarted for ${courseTitle}`,
      emoji: '⏳',
      color: '#f59e0b',
      message: 'Your enrollment has been moved back to pending status. Admin will review it again.',
    },
    suspended: {
      subject: `Enrollment paused for ${courseTitle}`,
      emoji: '⏸️',
      color: '#f59e0b',
      message:
        'Your enrollment has been temporarily suspended. Contact support for more information.',
    },
    completed: {
      subject: `Congratulations! You completed ${courseTitle}!`,
      emoji: '🏆',
      color: '#8b5cf6',
      message: 'Congratulations on completing the course! Your achievement has been recorded.',
    },
    revoked: {
      subject: `Enrollment revoked for ${courseTitle}`,
      emoji: '🚫',
      color: '#ef4444',
      message: 'Your enrollment has been revoked. Contact support if you believe this is an error.',
    },
    rejected: {
      subject: `Enrollment request rejected for ${courseTitle}`,
      emoji: '❌',
      color: '#ef4444',
      message:
        'Unfortunately, your enrollment request has been rejected. Contact support for more information.',
    },
  }

  const config = statusConfig[newStatus] || statusConfig.pending

  try {
    await transporter.sendMail({
      from,
      to,
      subject: config.subject,
      text: `Hi ${safeName},\n\n${config.message}\n\nCourse: ${courseTitle}\n${adminNotes ? `\nAdmin notes: ${adminNotes}` : ''}\n\n${newStatus === 'active' ? `Start learning: ${appUrl}/courses` : `View your enrollments: ${appUrl}/account`}\n\n— DPI Computing Society`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
          <h2 style="margin:0 0 16px">${config.emoji} Hi ${safeName}!</h2>
          <p style="margin:0 0 12px">${config.message}</p>
          <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px">
            <p style="margin:0;font-weight:bold">Course: ${courseTitle}</p>
            <p style="margin:8px 0 0">Status: <strong style="color:${config.color}">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</strong></p>
            ${adminNotes ? `<p style="margin:8px 0 0;font-size:14px;color:#6b7280">Note: ${adminNotes}</p>` : ''}
          </div>
          <p style="margin:0 0 16px">
            <a href="${newStatus === 'active' ? `${appUrl}/courses` : `${appUrl}/account`}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">${newStatus === 'active' ? 'Start Learning' : 'View Enrollments'}</a>
          </p>
          <p style="margin:0;color:#6b7280">— DPI Computing Society Team</p>
        </div>
      `.trim(),
    })
  } catch (err) {
    console.error('[Mail] Enrollment status update email failed', to, err)
  }
}
