import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendContactEmail, sendContactConfirmationEmail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    const submission = await payload.create({
      collection: 'contact-submissions' as any,
      data: {
        name,
        email,
        phone: phone || '',
        subject,
        message,
        status: 'unread',
      },
    })

    try {
      const contactSettings = await payload.findGlobal({
        slug: 'contact-settings' as any,
        depth: 0,
      }) as any

      if (contactSettings?.notificationEmail && contactSettings?.receiveEmail !== false) {
        await sendContactEmail({
          to: contactSettings.notificationEmail,
          fromName: name,
          fromEmail: email,
          subject: subject,
          message: message,
          phone: phone,
        })
      } else {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM
        if (adminEmail) {
          await sendContactEmail({
            to: adminEmail,
            fromName: name,
            fromEmail: email,
            subject: subject,
            message: message,
            phone: phone,
          })
        }
      }
    } catch (emailError) {
      console.error('[Contact API] Failed to send notification email:', emailError)
    }

    try {
      await sendContactConfirmationEmail({
        to: email,
        name: name,
        subject: subject,
      })
    } catch (confirmError) {
      console.error('[Contact API] Failed to send confirmation email:', confirmError)
    }

    return NextResponse.json({
      success: true,
      id: submission.id,
      message: 'Your message has been sent successfully!',
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again later.' },
      { status: 500 }
    )
  }
}
