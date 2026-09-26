import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import './styles.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { getRequestLocale } from '@/lib/i18n-server'
import { Providers } from '@/components/Providers'
import { createPageMetadata, createViewport, createPWAMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo-structured'
import { LenisProvider } from '@/components/LenisProvider'
import { DynamicPopupManager } from '@/components/popup/DynamicPopupManager'
import { AddToHomeScreenDrawer } from '@/components/AddToHomeScreenDrawer'
import Script from 'next/script'

export const metadata: ReturnType<typeof createPageMetadata> & Metadata = {
  ...createPageMetadata({
    description: 'Official website of DPI Robotics Club with courses, achievements, and community.',
    path: '/',
    keywords: ['DPIRC', 'DPI Robotics Club', 'robotics', 'courses', 'Bangladesh'],
  }),
  ...createPWAMetadata(),
}

export const viewport = createViewport()

// 1. Initialize the font with supported Inter subsets
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter', // Define a CSS variable for Tailwind use
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  const htmlLang = locale === 'bn' ? 'bn' : 'en'

  return (
    <html
      lang={htmlLang}
      dir="ltr"
      className={cn('font-sans lenis lenis-smooth html.lenis', inter.variable)}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen flex-col no-scrollbar transition-colors duration-300"
        cz-shortcut-listen="true"
      >
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <Providers initialLocale={locale}>
          <LenisProvider>
            <Header />
            <main className="flex-1 font-sans min-h-[calc(100vh-64px)]">{children}</main>
            <MobileBottomNav />
            <Footer />
            <DynamicPopupManager />
            <AddToHomeScreenDrawer />
          </LenisProvider>
        </Providers>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-L2F06NV0B5" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-L2F06NV0B5');`}
        </Script>
      </body>
    </html>
  )
}
