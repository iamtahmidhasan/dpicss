// hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me', {
          credentials: 'include',
          cache: 'no-store',
        })
        const data = (await res.json().catch(() => ({}))) as { user?: unknown }
        setUser(data.user ?? null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    void fetchUser()
  }, [])

  return { user, loading }
}
