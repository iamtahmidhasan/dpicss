import { Mail, Settings, Shield, CheckCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FluidMorphBg } from '@/components/ui/fluid-morph-bg'
import Link from 'next/link'

type AccountHeaderCardProps = {
  firstName: string
  lastName: string
  email: string
  bio?: string
  isOfficial: boolean
  isVerified?: boolean | null
  isAdmin: boolean
  avatarUrl: string
  fallbackAvatar: string
  googlePicture?: string
  committeeRoles?: Array<{ committee?: { name?: string }; role?: string }>
  onLogout: () => void
}

export function AccountHeaderCard({
  firstName,
  lastName,
  email,
  bio,
  isOfficial,
  isVerified,
  isAdmin,
  avatarUrl,
  googlePicture,
  fallbackAvatar,
  committeeRoles,
  onLogout,
}: AccountHeaderCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative p-6">
        <FluidMorphBg className="absolute inset-0" />
        <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
            <AvatarImage
              src={avatarUrl || googlePicture || fallbackAvatar}
              alt="Profile picture"
              className="object-cover"
            />
            <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-2xl font-bold">
              {firstName[0] || email[0].toUpperCase()}
              {lastName[0] || ''}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
                  {firstName || 'First Name'} {lastName || 'Last Name'}
                </h1>
                <p className="flex items-center gap-2 text-sm text-white/70 sm:text-lg md:text-xl">
                  <Mail className="h-4 w-4" />
                  {email}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-white/15 text-white capitalize">
                    {isOfficial ? 'Official Member' : 'Unofficial Member'}
                  </Badge>
                  {isVerified && (
                    <Badge
                      variant="outline"
                      className="border-success/50 bg-success/10 text-success-on-inverse"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center">
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive-on-inverse">
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    </Link>
                  )}
                  {committeeRoles?.map((cr, i) => (
                    <Badge key={`c-${i}`} variant="secondary" className="bg-white/15 text-white">
                      {cr.committee?.name || 'Committee'}
                    </Badge>
                  ))}
                  {committeeRoles?.filter((cr) => cr.role).map((cr, i) => (
                    <Badge key={`r-${i}`} variant="outline" className="border-white/30 text-white/80">
                      {cr.role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  onClick={onLogout}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            {bio && <p className="mt-4 max-w-2xl text-white/70">{bio}</p>}
          </div>
        </div>
      </div>
    </Card>
  )
}
