import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'
import { getCachedRegistrationSettings } from '@/lib/cache/global-settings-cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Lock } from 'lucide-react'
import { RegistrationSettingsProvider } from '@/components/RegistrationSettingsProvider'

export const metadata = createPageMetadata({
  title: 'Register',
  description: 'Create a DPICS account to enroll in courses and join the computing community.',
  path: '/register',
  noIndex: true,
})

export default async function RegisterLayout({ children }: { children: ReactNode }) {
  const payload = await getPayload({ config })
  const settings = await getCachedRegistrationSettings(payload)

  if (!settings.registrationEnabled) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Registration Locked</h1>
          <p className="text-muted-foreground">{settings.lockedMessage}</p>
        </div>
      </div>
    )
  }

  return <RegistrationSettingsProvider settings={settings}>{children}</RegistrationSettingsProvider>
}