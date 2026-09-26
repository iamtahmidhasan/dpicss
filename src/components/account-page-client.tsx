'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { AccountHeaderCard } from '@/components/account/AccountHeaderCard'
import { AccountTabsNav } from '@/components/account/AccountTabsNav'
import { AnnouncementsTab } from '@/components/account/AnnouncementsTab'
import { OfficialMemberDetailsEditTab } from '@/components/account/OfficialMemberDetailsEditTab'
import { ComplaintsPanel } from '@/components/complaints/ComplaintsPanel'
import { MemberPoster } from '@/components/account/MemberPoster'
import {
  User,
  BookOpen,
  Award,
  Calendar,
  Settings,
  Trophy,
  Target,
  Star,
  Activity,
  Mail,
  CheckCircle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { t, type Messages } from '@/messages'
import { useLocale } from '@/components/Providers'

type TabKey =
  | 'profile'
  | 'courses'
  | 'enrollments'
  | 'certificates'
  | 'registration'
  | 'announcements'
  | 'complaints'
  | 'poster'
  | 'overview'

type ProfileCourse = {
  id?: string
  title?: string
  description?: string
  difficulty?: string
}

type Profile = {
  memberId?: string
  avatar?: {
    url?: string
  }
  firstName?: string
  lastName?: string
  bio?: string
  institutionName?: string
  department?: string
  submissionDetails?: string
  completedCourses?: ProfileCourse[]
  directoryApprovalStatus?: string
  memberType?: string
  isActive?: boolean
  hasPaidRegistration?: boolean
  paymentMethod?: string
  paymentTransactionId?: string
  senderNumber?: string
  paymentNotes?: string
  group?: string
  whatsappNumber?: string
  phoneNumber?: string
  boardRoll?: string
  season?: string
  bloodGroup?: string
  committeeRoles?: Array<{ committee?: { id?: string; name?: string }; role?: string }>
  nidOrBirthCertificate?: { url?: string; id?: string }
  studentIdCard?: { url?: string; id?: string }
  passportSizeImage?: { url?: string; id?: string }
  manualCertificates?: Array<{
    certificateId?: string
    course?: { id?: string; title?: string }
    certificateImageUrl?: string
  }>
  complaints?: Array<{ message?: string; status?: string; createdAt?: string }>
  skills?: Array<{ skill?: string; level?: string }>
  socialLinks?: {
    facebook?: string
    whatsapp?: string
    linkedin?: string
    github?: string
    website?: string
  }
}

type Enrollment = {
  id?: string
  createdAt?: string
  progress?: number
  course?: {
    title?: string
  }
}

type Announcement = {
  id: string
  title?: string
  summary?: string
  content?: unknown
  publishedAt?: string
}

type AccountData = {
  user: {
    email: string
    roles: string[]
    memberCategory?: 'official' | 'unofficial' | null
    isVerified?: boolean | null
    isActive?: boolean | null
    createdAt?: string
    googlePicture?: string
  }
  officialProfile?: Profile | null
  unofficialProfile?: Profile | null
  enrollments?: Enrollment[]
  announcements?: Announcement[]
  announcementReads?: string[]
  oneTimeProfilePicture?: boolean
  clubLogoUrl?: string
  clubName?: string
}

export function AccountPageClient({
  data,
  messages,
  locale: propLocale,
}: {
  data: AccountData
  messages: Messages
  locale: 'en' | 'bn'
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const isOfficial = data.user.memberCategory === 'official'

  const requestedTab = searchParams.get('tab')
  const requestedAnnouncement = searchParams.get('announcement')
  const resolvedTab = useMemo<TabKey>(() => {
    const allowed: TabKey[] = [
      'overview',
      'profile',
      'registration',
      'courses',
      'enrollments',
      'certificates',
      'announcements',
      'complaints',
      'poster',
    ]

    if (requestedTab && allowed.includes(requestedTab as TabKey)) {
      return requestedTab as TabKey
    }

    if (requestedAnnouncement) {
      return 'announcements'
    }

    return 'overview'
  }, [requestedAnnouncement, requestedTab])

  const [activeTab, setActiveTab] = useState<TabKey>(resolvedTab)
  const shouldSyncTab = Boolean(requestedTab || requestedAnnouncement)

  useEffect(() => {
    if (!shouldSyncTab) return
    if (resolvedTab !== activeTab) {
      setActiveTab(resolvedTab)
    }
  }, [activeTab, resolvedTab, shouldSyncTab])

  const existingAvatarURL = useMemo(() => {
    const avatar = isOfficial ? data.officialProfile?.avatar : data.unofficialProfile?.avatar
    if (avatar && typeof avatar === 'object') {
      return String((avatar as { url?: string }).url || '')
    }
    return ''
  }, [data.officialProfile, data.unofficialProfile, isOfficial])

  const hasExistingAvatar = Boolean(existingAvatarURL)

  const isAvatarLocked =
    data.oneTimeProfilePicture === true && (hasExistingAvatar || Boolean(avatarId))

  const fallbackAvatar = useMemo(
    () =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.email)}&background=111827&color=fff`,
    [data.user.email],
  )

  const [form, setForm] = useState({
    firstName: String(data.officialProfile?.firstName || data.unofficialProfile?.firstName || ''),
    lastName: String(data.officialProfile?.lastName || data.unofficialProfile?.lastName || ''),
    bio: String(data.officialProfile?.bio || data.unofficialProfile?.bio || ''),
    institutionName: String(data.unofficialProfile?.institutionName || ''),
    department: String(data.unofficialProfile?.department || ''),
    submissionDetails: String(data.unofficialProfile?.submissionDetails || ''),
    skills: Array.isArray(data.officialProfile?.skills) ? data.officialProfile.skills : [],
    socialLinks: {
      facebook: String(data.officialProfile?.socialLinks?.facebook || ''),
      whatsapp: String(data.officialProfile?.socialLinks?.whatsapp || ''),
      linkedin: String(data.officialProfile?.socialLinks?.linkedin || ''),
      github: String(data.officialProfile?.socialLinks?.github || ''),
      website: String(data.officialProfile?.socialLinks?.website || ''),
    },
  })

  const courses = useMemo<ProfileCourse[]>(
    () =>
      Array.isArray(data.officialProfile?.completedCourses)
        ? data.officialProfile.completedCourses
        : [],
    [data.officialProfile],
  )

  const directoryApproval = data.officialProfile?.directoryApprovalStatus
  const showPendingBanner = isOfficial && directoryApproval === 'pending'
  const showRejectedBanner = isOfficial && directoryApproval === 'rejected'
  const enrollments = useMemo<Enrollment[]>(
    () => (Array.isArray(data.enrollments) ? data.enrollments : []),
    [data.enrollments],
  )
  const activeProfile = isOfficial ? data.officialProfile : data.unofficialProfile
  const hasCertificate = Boolean(activeProfile?.manualCertificates?.length)
  const announcements = useMemo<Announcement[]>(
    () => (Array.isArray(data.announcements) ? data.announcements : []),
    [data.announcements],
  )
  const announcementReads = useMemo<string[]>(
    () => (Array.isArray(data.announcementReads) ? data.announcementReads : []),
    [data.announcementReads],
  )
  const complaints = useMemo(
    () => (Array.isArray(activeProfile?.complaints) ? activeProfile.complaints : []),
    [activeProfile?.complaints],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('socialLinks.')) {
      const key = name.replace('socialLinks.', '') as keyof typeof form.socialLinks
      setForm((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [key]: value,
        },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills: form.skills,
          socialLinks: form.socialLinks,
          avatar: avatarId,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Failed to update account')
      } else {
        setMessage('Profile updated successfully')
        router.refresh()
      }
    } catch {
      setError('Something went wrong while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setMessage('')
    setIsUploading(true)

    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim() || data.user.email

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `${fullName} profile picture`)
      formData.append('alt', `${fullName} profile picture`)
      formData.append('usage', 'profile')
      if (avatarId) {
        formData.append('replaceMediaId', avatarId)
      }

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.errors?.[0]?.message || payload?.error || 'Failed to upload avatar')
        return
      }

      const uploadedId = String(payload?.doc?.id || payload?.id || '')
      if (!uploadedId) {
        setError('Upload completed but media ID is missing')
        return
      }

      setAvatarId(uploadedId)
      setMessage('Avatar uploaded. Click "Save Profile" to apply it.')
    } catch {
      setError('Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6 min-h-[calc(100vh-64px)]">
      {/* Account Header */}
      <div className="mb-8">
        <AccountHeaderCard
          firstName={form.firstName}
          lastName={form.lastName}
          email={data.user.email}
          bio={form.bio || data.officialProfile?.bio || data.unofficialProfile?.bio || ''}
          isOfficial={isOfficial}
          isVerified={data.user.isVerified}
          isAdmin={Boolean(data.user.roles?.includes('admin'))}
          googlePicture={data.user.googlePicture}
          avatarUrl={existingAvatarURL}
          fallbackAvatar={fallbackAvatar}
          committeeRoles={data.officialProfile?.committeeRoles}
          onLogout={handleLogout}
        />
      </div>

      {/* Approval banners (match public profile page) */}
      {showPendingBanner && (
        <div className="mb-6">
          <Alert className="mb-6 border-warning/40 bg-warning/10">
            <AlertTitle>{t(messages, 'profile.awaitingApproval')}</AlertTitle>
            <AlertDescription>{t(messages, 'profile.approvalMessage')}</AlertDescription>
          </Alert>
        </div>
      )}
      {showRejectedBanner && (
        <div className="mb-6">
          <Alert className="mb-6 border-destructive/40 bg-destructive/10">
            <AlertTitle>{t(messages, 'profile.notApproved')}</AlertTitle>
            <AlertDescription>{t(messages, 'profile.rejectionMessage')}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Account Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        orientation="horizontal"
        className="w-full flex-col"
      >
        <AccountTabsNav
          isOfficial={isOfficial}
          directoryApprovalStatus={directoryApproval}
          messages={messages}
        />

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t(messages, 'profile.accountInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(messages, 'profile.email')}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {data.user.email}
                  </p>
                </div>
                {(data.officialProfile?.memberId || data.unofficialProfile?.memberId) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t(messages, 'profile.memberId')}
                    </p>
                    <p className="font-mono text-sm">
                      {String(data.officialProfile?.memberId || data.unofficialProfile?.memberId)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(messages, 'profile.memberType')}
                  </p>
                  <p className="text-sm capitalize">{data.user.memberCategory || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(messages, 'profile.accountStatus')}
                  </p>
                  <div className="flex items-center gap-2">
                    {data.user.isActive ? (
                      <Badge variant="outline" className="text-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t(messages, 'profile.active')}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{t(messages, 'profile.inactive')}</Badge>
                    )}
                  </div>
                </div>
                {/* {data.user.roles && data.user.roles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t(messages, 'profile.roles')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.user.roles.map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )} */}
                {(data.officialProfile?.committeeRoles?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t(messages, 'profile.roles')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.officialProfile?.committeeRoles?.flatMap((cr, i) => {
                        const badges: { key: string; label: string }[] = []
                        const name = cr.committee?.name || 'Committee'
                        badges.push({ key: `c-${i}`, label: name })
                        if (cr.role) badges.push({ key: `r-${i}`, label: cr.role })
                        return badges
                      }).map((b) => (
                        <Badge key={b.key} variant="default" className="text-xs">
                          {b.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t(messages, 'profile.statistics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-success" />
                    <span className="text-sm text-muted-foreground">
                      {t(messages, 'profile.completedCourses')}
                    </span>
                  </div>
                  <span className="font-semibold">{courses.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cat-blue" />
                    <span className="text-sm text-muted-foreground">
                      {t(messages, 'profile.enrollments')}
                    </span>
                  </div>
                  <span className="font-semibold">{enrollments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-cat-violet" />
                    <span className="text-sm text-muted-foreground">
                      {t(messages, 'profile.certificates')}
                    </span>
                  </div>
                  <span className="font-semibold">{hasCertificate ? 1 : 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t(messages, 'profile.recentActivity')}
              </CardTitle>
              <CardDescription>{t(messages, 'profile.activityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t(messages, 'profile.accountCreated')}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {data.user.createdAt
                        ? new Date(data.user.createdAt).toLocaleDateString()
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>

                {enrollments.slice(0, 2).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="h-8 w-8 bg-cat-blue/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-cat-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t(messages, 'profile.enrolled')} {enrollment.course?.title || 'a course'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {activeProfile?.manualCertificates?.length ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activeProfile.manualCertificates.length} certificate(s) assigned
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t(messages, 'profile.profileSettings')}
              </CardTitle>
              <CardDescription>
                {isOfficial
                  ? t(messages, 'profile.officialProfileDesc')
                  : t(messages, 'profile.unofficialProfileDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave}>
                <FieldGroup>
                  <Field>
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={existingAvatarURL || data.user.googlePicture || fallbackAvatar}
                          alt="Profile picture"
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {form.firstName[0] || data.user.email[0].toUpperCase()}
                          {form.lastName[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {t(messages, 'profile.profilePicture')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {avatarId
                            ? 'New avatar ready to save'
                            : hasExistingAvatar
                              ? 'Profile picture is locked and cannot be changed'
                              : 'Upload a new profile picture'}
                        </p>
                      </div>
                    </div>
                    <FieldLabel htmlFor="avatar" hidden={isAvatarLocked}>
                      Change Profile Image
                    </FieldLabel>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading || isAvatarLocked}
                      hidden={isAvatarLocked}
                    />
                    {isUploading && (
                      <FieldDescription className="inline-flex items-center gap-2 mt-2">
                        <Spinner />
                        Uploading image...
                      </FieldDescription>
                    )}
                    {isAvatarLocked && (
                      <FieldDescription className={avatarId ? 'text-success' : 'text-warning'}>
                        {avatarId
                          ? 'Image uploaded. Save your profile to apply it.'
                          : 'The one-time profile picture setting is enabled. You cannot upload a new picture after it has been set.'}
                      </FieldDescription>
                    )}
                  </Field>

                  <Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                    <textarea
                      id="bio"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      placeholder="Tell us about yourself..."
                    />
                  </Field>

                  {isOfficial && (
                    <Field>
                      <FieldLabel>Skills</FieldLabel>
                      <div className="space-y-2">
                        {form.skills?.map((skill, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={skill.skill || ''}
                              onChange={(e) => {
                                const newSkills = [...(form.skills || [])]
                                newSkills[index] = { ...newSkills[index], skill: e.target.value }
                                setForm((f: typeof form) => ({ ...f, skills: newSkills }))
                              }}
                              placeholder="Skill name"
                              className="flex-1"
                            />
                            <select
                              value={skill.level || 'beginner'}
                              onChange={(e) => {
                                const newSkills = [...(form.skills || [])]
                                newSkills[index] = { ...newSkills[index], level: e.target.value }
                                setForm((f: typeof form) => ({ ...f, skills: newSkills }))
                              }}
                              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newSkills = form.skills?.filter((_, i) => i !== index) || []
                                setForm((f: typeof form) => ({ ...f, skills: newSkills }))
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSkills = [
                              ...(form.skills || []),
                              { skill: '', level: 'beginner' },
                            ]
                            setForm((f: typeof form) => ({ ...f, skills: newSkills }))
                          }}
                        >
                          + Add Skill
                        </Button>
                      </div>
                    </Field>
                  )}

                  {isOfficial && (
                    <Field>
                      <FieldLabel>Social Links</FieldLabel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor="socialLinks.facebook" className="text-xs">
                            Facebook
                          </FieldLabel>
                          <Input
                            id="socialLinks.facebook"
                            name="socialLinks.facebook"
                            value={form.socialLinks?.facebook || ''}
                            onChange={handleChange}
                            placeholder="https://facebook.com/username"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="socialLinks.whatsapp" className="text-xs">
                            WhatsApp
                          </FieldLabel>
                          <Input
                            id="socialLinks.whatsapp"
                            name="socialLinks.whatsapp"
                            value={form.socialLinks?.whatsapp || ''}
                            onChange={handleChange}
                            placeholder="+8801234567890"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="socialLinks.linkedin" className="text-xs">
                            LinkedIn
                          </FieldLabel>
                          <Input
                            id="socialLinks.linkedin"
                            name="socialLinks.linkedin"
                            value={form.socialLinks?.linkedin || ''}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="socialLinks.github" className="text-xs">
                            GitHub
                          </FieldLabel>
                          <Input
                            id="socialLinks.github"
                            name="socialLinks.github"
                            value={form.socialLinks?.github || ''}
                            onChange={handleChange}
                            placeholder="https://github.com/username"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel htmlFor="socialLinks.website" className="text-xs">
                            Website
                          </FieldLabel>
                          <Input
                            id="socialLinks.website"
                            name="socialLinks.website"
                            value={form.socialLinks?.website || ''}
                            onChange={handleChange}
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </Field>
                  )}

                  {!isOfficial && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="institutionName">Institution / University</FieldLabel>
                        <Input
                          id="institutionName"
                          name="institutionName"
                          value={form.institutionName}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="department">Department</FieldLabel>
                        <Input
                          id="department"
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="submissionDetails">Submission Details</FieldLabel>
                        <textarea
                          id="submissionDetails"
                          name="submissionDetails"
                          value={form.submissionDetails}
                          onChange={handleChange}
                          className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                          placeholder="Provide details about your application..."
                          required
                        />
                      </Field>
                    </>
                  )}

                  {(message || error) && (
                    <Field>
                      <FieldDescription className={error ? 'text-destructive' : 'text-success'}>
                        {error || message}
                      </FieldDescription>
                    </Field>
                  )}

                  <Field>
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                      {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner />
                          Saving...
                        </span>
                      ) : (
                        'Save Profile'
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {isOfficial && (
          <TabsContent value="registration" className="mt-6">
            <OfficialMemberDetailsEditTab
              profile={{
                hasPaidRegistration: data.officialProfile?.hasPaidRegistration,
                paymentMethod: data.officialProfile?.paymentMethod,
                paymentTransactionId: data.officialProfile?.paymentTransactionId,
                senderNumber: data.officialProfile?.senderNumber,
                paymentNotes: data.officialProfile?.paymentNotes,
                group: data.officialProfile?.group,
                whatsappNumber: data.officialProfile?.whatsappNumber,
                phoneNumber: data.officialProfile?.phoneNumber,
                boardRoll: data.officialProfile?.boardRoll,
                season: data.officialProfile?.season,
                committeeRoles: data.officialProfile?.committeeRoles,
                bloodGroup: data.officialProfile?.bloodGroup,
                nidOrBirthCertificate: data.officialProfile?.nidOrBirthCertificate,
                studentIdCard: data.officialProfile?.studentIdCard,
                passportSizeImage: data.officialProfile?.passportSizeImage,
              }}
            />
          </TabsContent>
        )}

        {/* <TabsContent value="courses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t(messages, 'profile.completedCourses')}
              </CardTitle>
              <CardDescription>{t(messages, 'profile.completedCourses')}</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed courses yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start learning to see your completed courses here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {courses.map((course: any, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-success/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {course?.title || `Course ${index + 1}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">Completed successfully</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="enrollments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t(messages, 'profile.courseEnrollments')}
              </CardTitle>
              <CardDescription>{t(messages, 'profile.enrollmentDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active enrollments.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Browse available courses to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {enrollments.map((enrollment: any, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-cat-blue/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-cat-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {enrollment?.course?.title || `Course ${index + 1}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t(messages, 'profile.enrolledOn')}{' '}
                            {new Date(enrollment.createdAt).toLocaleDateString()}
                          </p>
                          {enrollment.progress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{t(messages, 'profile.progress')}</span>
                                <span>{enrollment.progress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-cat-blue h-2 rounded-full"
                                  style={{ width: `${enrollment.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {enrollment?.course?.slug && (
                            <Button asChild className="mt-3 w-full">
                              <Link href={`/courses/${enrollment.course.slug}`}>
                                {t(messages, 'profile.watchCourse')}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <AnnouncementsTab announcements={announcements} readAnnouncementIds={announcementReads} />
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificates
              </CardTitle>
              <CardDescription>Certificates assigned to your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeProfile?.manualCertificates ||
              activeProfile.manualCertificates.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No certificates assigned yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contact support if you believe this is a mistake.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeProfile.manualCertificates.map((cert: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-cat-violet/10 rounded-lg flex items-center justify-center">
                          <Award className="h-5 w-5 text-cat-violet" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {typeof cert.course === 'object' && cert.course !== null
                              ? cert.course.title
                              : 'Certificate'}
                          </h3>
                          {cert.certificateId ? (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              ID: {cert.certificateId}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {cert.certificateImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cert.certificateImageUrl}
                          alt="Certificate"
                          className="mt-4 w-full rounded-lg border object-contain"
                        />
                      ) : null}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isOfficial && directoryApproval === 'approved' && (
          <TabsContent value="poster" className="mt-6">
            <MemberPoster
              memberId={data.officialProfile?.memberId}
              firstName={data.officialProfile?.firstName}
              lastName={data.officialProfile?.lastName}
              avatarUrl={existingAvatarURL || data.user.googlePicture || undefined}
              memberType={data.officialProfile?.memberType}
              clubLogoUrl={data.clubLogoUrl}
              clubName={data.clubName}
              directoryApprovalStatus={directoryApproval}
            />
          </TabsContent>
        )}

        <TabsContent value="complaints" className="mt-6">
          <ComplaintsPanel complaints={complaints} canSubmit={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
