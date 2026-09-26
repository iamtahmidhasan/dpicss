import { Mail, Phone, MapPin, MessageCircle, Clock, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getRequestLocale } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { ContactForm } from '@/components/contact/ContactForm'
import type { ContactPageSettingsData } from '@/globals/types'
import type { Metadata } from 'next'

type SocialLink = {
  platform: string
  url: string
  icon?: string
}

type FaqItem = {
  question?: unknown
  answer?: unknown
}

type FaqSection = {
  enable?: boolean
  title?: unknown
  faqs?: FaqItem[]
}

type ContactSettings = {
  title?: unknown
  description?: unknown
  mapEmbedUrl?: string
  officeAddress?: unknown
  googleMapLink?: string
  email?: string
  phone?: string
  whatsapp?: string
  socialLinks?: SocialLink[]
  faqSection?: FaqSection
}

export const metadata: Metadata = {
  title: 'Contact | DPI Computing Society',
  description: 'Get in touch with DPI Computing Society for any inquiries or questions.',
}

function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: 'Facebook',
    twitter: 'Twitter',
    instagram: 'Instagram',
    linkedin: 'Linkedin',
    youtube: 'Youtube',
    github: 'Github',
  }
  return icons[platform.toLowerCase()] || 'Link'
}

export default async function ContactPage() {
  let payload
  try {
    payload = await getPayloadWithRetry()
  } catch (error) {
    console.error('Failed to initialize Payload:', error)
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Unable to load contact settings. Please try again later.
          </p>
        </div>
      </main>
    )
  }

  const locale = await getRequestLocale()

  const [contactPageSettings, contactSettingsResult] = await Promise.all([
    getGlobalPayload<ContactPageSettingsData>('contact-page-settings', locale),
    payload.findGlobal({
      slug: 'contact-settings' as any,
      depth: 0,
    }).catch(() => null),
  ])

  const contactSettings = contactSettingsResult as unknown as ContactSettings | null

  const title = contactSettings?.title
    ? pickLocalizedString(contactSettings.title, locale as 'en' | 'bn')
    : contactPageSettings.title

  const description = contactSettings?.description
    ? pickLocalizedString(contactSettings.description, locale as 'en' | 'bn')
    : contactPageSettings.subtitle

  const officeAddress = contactSettings?.officeAddress
    ? pickLocalizedString(contactSettings.officeAddress, locale as 'en' | 'bn')
    : null

  const formMessages = {
    name: contactPageSettings.form.name,
    namePlaceholder: contactPageSettings.form.namePlaceholder,
    email: contactPageSettings.form.email,
    emailPlaceholder: contactPageSettings.form.emailPlaceholder,
    phone: contactPageSettings.form.phone,
    phonePlaceholder: contactPageSettings.form.phonePlaceholder,
    subject: contactPageSettings.form.subject,
    subjectPlaceholder: contactPageSettings.form.subjectPlaceholder,
    message: contactPageSettings.form.message,
    messagePlaceholder: contactPageSettings.form.messagePlaceholder,
    submit: contactPageSettings.form.submit,
    sending: contactPageSettings.form.submitting,
    success: contactPageSettings.form.success,
    successMessage: contactPageSettings.form.successMessage,
    error: contactPageSettings.form.error,
    errorMessage: contactPageSettings.form.errorMessage,
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <ContactForm messages={formMessages} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{contactPageSettings.info.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactSettings?.email && (
                <a
                  href={`mailto:${contactSettings.email}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{contactPageSettings.info.email}</p>
                    <p className="text-muted-foreground">{contactSettings.email}</p>
                  </div>
                </a>
              )}

              {contactSettings?.phone && (
                <a
                  href={`tel:${contactSettings.phone}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{contactPageSettings.info.phone}</p>
                    <p className="text-muted-foreground">{contactSettings.phone}</p>
                  </div>
                </a>
              )}

              {contactSettings?.whatsapp && (
                <a
                  href={`https://wa.me/${contactSettings.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                    <MessageCircle className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{contactPageSettings.whatsapp}</p>
                    <p className="text-muted-foreground">{contactSettings.whatsapp}</p>
                  </div>
                </a>
              )}

              {officeAddress && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{contactPageSettings.info.address}</p>
                    <p className="text-muted-foreground">{officeAddress}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{contactPageSettings.info.hours}</p>
                  <p className="text-muted-foreground">{contactPageSettings.officeHoursValue}</p>
                </div>
              </div>

              {contactSettings?.socialLinks && contactSettings.socialLinks.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium">{contactPageSettings.followUs}</p>
                    <div className="flex flex-wrap gap-2">
                      {contactSettings.socialLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <span>{getSocialIcon(link.platform)}</span>
                          <span className="capitalize">{link.platform}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {contactSettings?.mapEmbedUrl && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square w-full lg:aspect-[4/3]">
                  <iframe
                    src={contactSettings.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Office Location"
                    className="w-full h-full"
                  />
                </div>
                {contactSettings.googleMapLink && (
                  <div className="p-4">
                    <a
                      href={contactSettings.googleMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <MapPin className="size-4" />
                      {contactPageSettings.map.openInMaps}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!contactSettings?.mapEmbedUrl && officeAddress && (
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <MapPin className="mx-auto mb-4 size-12 text-muted-foreground/40" />
                  <p className="font-medium">{contactPageSettings.map.ourLocation}</p>
                  <p className="mt-1 text-muted-foreground">{officeAddress}</p>
                  {contactSettings?.googleMapLink && (
                    <a
                      href={contactSettings.googleMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {contactPageSettings.map.openInMaps}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {contactSettings?.faqSection?.enable !== false && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {contactSettings?.faqSection?.title
                    ? pickLocalizedString(contactSettings.faqSection.title, locale as 'en' | 'bn')
                    : contactPageSettings.faq.title
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactSettings?.faqSection?.faqs && contactSettings.faqSection.faqs.length > 0 ? (
                  contactSettings.faqSection.faqs.map((faq, index) => (
                    <div key={index}>
                      {index > 0 && <Separator />}
                      <h4 className="font-medium">
                        {faq.question
                          ? pickLocalizedString(faq.question, locale as 'en' | 'bn')
                          : ''}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {faq.answer
                          ? pickLocalizedString(faq.answer, locale as 'en' | 'bn')
                          : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium">{contactPageSettings.faq.q1}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {contactPageSettings.faq.a1}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium">{contactPageSettings.faq.q2}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {contactPageSettings.faq.a2}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium">{contactPageSettings.faq.q3}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {contactPageSettings.faq.a3}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
