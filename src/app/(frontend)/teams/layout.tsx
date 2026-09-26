import type { Metadata } from 'next'

export default async function TeamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
