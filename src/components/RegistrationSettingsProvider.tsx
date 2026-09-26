'use client'

import { createContext, useContext, type ReactNode } from 'react'

type RegistrationSettings = {
  registrationEnabled: boolean
  lockedMessage: string
  allowOfficialRegistration: boolean
  allowUnofficialRegistration: boolean
}

const RegistrationSettingsContext = createContext<RegistrationSettings | null>(null)

export function RegistrationSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode
  settings: RegistrationSettings
}) {
  return (
    <RegistrationSettingsContext.Provider value={settings}>
      {children}
    </RegistrationSettingsContext.Provider>
  )
}

export function useRegistrationSettings(): RegistrationSettings {
  const ctx = useContext(RegistrationSettingsContext)
  if (!ctx) {
    throw new Error('useRegistrationSettings must be used within RegistrationSettingsProvider')
  }
  return ctx
}
