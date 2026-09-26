'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, CheckCircle2, Download, Info, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const CSRF_COOKIE = 'dpirc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const encodedName = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(encodedName)) {
      return decodeURIComponent(trimmed.slice(encodedName.length))
    }
  }
  return ''
}

async function getCsrfToken(): Promise<string> {
  const fromCookie = readCookie(CSRF_COOKIE)
  if (fromCookie) return fromCookie
  try {
    const res = await fetch('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
    const fromHeader = res.headers.get(CSRF_HEADER) || ''
    if (fromHeader) return fromHeader
  } catch {
    // Ignore
  }
  return readCookie(CSRF_COOKIE)
}

type ProfileData = {
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
  committeeRoles?: Array<{ committee?: { name?: string }; role?: string }>
  nidOrBirthCertificate?: { url?: string; id?: string }
  studentIdCard?: { url?: string; id?: string }
  passportSizeImage?: { url?: string; id?: string }
}

type FormState = {
  hasPaidRegistration: boolean
  paymentMethod: string
  paymentTransactionId: string
  senderNumber: string
  paymentNotes: string
  group: string
  whatsappNumber: string
  phoneNumber: string
  boardRoll: string
  season: string
  bloodGroup: string
}

type FileUploadState = {
  nidOrBirthCertificate: boolean
  studentIdCard: boolean
  passportSizeImage: boolean
}

type PaymentSettings = {
  bkash?: { enabled?: boolean; number?: string; type?: string }
  nagad?: { enabled?: boolean; number?: string; type?: string }
  rocket?: { enabled?: boolean; number?: string; type?: string }
  cash?: { enabled?: boolean; instructions?: string }
  bank?: {
    enabled?: boolean
    accountName?: string
    accountNumber?: string
    bankName?: string
    branch?: string
    routing?: string
  }
}

export function OfficialMemberDetailsEditTab({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [showCopied, setShowCopied] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState<FileUploadState>({
    nidOrBirthCertificate: false,
    studentIdCard: false,
    passportSizeImage: false,
  })

  const [form, setForm] = useState<FormState>({
    hasPaidRegistration: profile.hasPaidRegistration ?? false,
    paymentMethod: profile.paymentMethod ?? '',
    paymentTransactionId: profile.paymentTransactionId ?? '',
    senderNumber: profile.senderNumber ?? '',
    paymentNotes: profile.paymentNotes ?? '',
    group: profile.group ?? '',
    whatsappNumber: profile.whatsappNumber ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    boardRoll: profile.boardRoll ?? '',
    season: profile.season ?? '',
    bloodGroup: profile.bloodGroup ?? '',
  })

  useEffect(() => {
    if (isEditing) {
      fetch('/api/payment-settings')
        .then((res) => res.json())
        .then((data) => setPaymentSettings(data || {}))
        .catch(() => setPaymentSettings({}))
    }
  }, [isEditing])

  const [files, setFiles] = useState<{
    nidOrBirthCertificate: File | null
    studentIdCard: File | null
    passportSizeImage: File | null
  }>({
    nidOrBirthCertificate: null,
    studentIdCard: null,
    passportSizeImage: null,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, type, value } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof typeof files,
  ) => {
    const file = e.target.files?.[0] || null
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFiles((prev) => ({ ...prev, [fieldName]: file }))
      setError('')
    }
  }

  const uploadFile = async (
    file: File,
    fieldName: string,
    fileName: string,
    oldMediaId?: string | null,
  ): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', fileName)
      formData.append('alt', fileName)
      formData.append('usage', 'profile')
      if (oldMediaId) {
        formData.append('replaceMediaId', oldMediaId)
      }

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) throw new Error('File upload failed')

      const payload = await response.json().catch(() => null)
      return String(payload?.doc?.id || payload?.id || '')
    } catch (err) {
      console.error(`Failed to upload ${fieldName}:`, err)
      throw new Error(`Failed to upload ${fieldName}`)
    }
  }

  const getPaymentNumber = (method: string): string => {
    if (!paymentSettings) return ''
    switch (method) {
      case 'bkash':
        return paymentSettings.bkash?.number || ''
      case 'nagad':
        return paymentSettings.nagad?.number || ''
      case 'rocket':
        return paymentSettings.rocket?.number || ''
      default:
        return ''
    }
  }

  const getBankInfo = () => paymentSettings?.bank

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShowCopied(label)
      setTimeout(() => setShowCopied(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setShowCopied(label)
      setTimeout(() => setShowCopied(null), 2000)
    }
  }

  const handlePaymentMethodChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: value,
      paymentTransactionId: '',
      senderNumber: '',
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // Validation
    if (!form.group.trim()) {
      setError('Group is required')
      return
    }
    if (!form.whatsappNumber.trim()) {
      setError('WhatsApp number is required')
      return
    }
    if (!form.phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }
    if (!form.boardRoll.trim()) {
      setError('Board roll is required')
      return
    }
    if (!form.season.trim()) {
      setError('Season is required')
      return
    }
    if (!form.bloodGroup) {
      setError('Blood group is required')
      return
    }

    if (form.hasPaidRegistration) {
      if (!form.paymentMethod) {
        setError('Payment method is required')
        return
      }
      if (form.paymentMethod !== 'hand_to_hand' && !form.paymentTransactionId.trim()) {
        setError('Transaction ID is required for this payment method')
        return
      }
    }

    setIsSaving(true)

    try {
      const csrfToken = await getCsrfToken()

      let nidOrBirthCertificateId: string | null = profile.nidOrBirthCertificate?.id || null
      let studentIdCardId: string | null = profile.studentIdCard?.id || null
      let passportSizeImageId: string | null = profile.passportSizeImage?.id || null

      if (files.nidOrBirthCertificate) {
        setFileUploading((prev) => ({ ...prev, nidOrBirthCertificate: true }))
        nidOrBirthCertificateId = await uploadFile(
          files.nidOrBirthCertificate,
          'nidOrBirthCertificate',
          'NID or Birth Certificate',
        )
        setFileUploading((prev) => ({ ...prev, nidOrBirthCertificate: false }))
      }

      if (files.studentIdCard) {
        setFileUploading((prev) => ({ ...prev, studentIdCard: true }))
        studentIdCardId = await uploadFile(files.studentIdCard, 'studentIdCard', 'Student ID Card')
        setFileUploading((prev) => ({ ...prev, studentIdCard: false }))
      }

      if (files.passportSizeImage) {
        setFileUploading((prev) => ({ ...prev, passportSizeImage: true }))
        passportSizeImageId = await uploadFile(
          files.passportSizeImage,
          'passportSizeImage',
          'Passport Size Image',
        )
        setFileUploading((prev) => ({ ...prev, passportSizeImage: false }))
      }

      const response = await fetch('/api/auth/official-member-details', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: JSON.stringify({
          hasPaidRegistration: form.hasPaidRegistration,
          paymentMethod: form.hasPaidRegistration ? form.paymentMethod : null,
          paymentTransactionId:
            form.hasPaidRegistration && form.paymentMethod !== 'hand_to_hand'
              ? form.paymentTransactionId
              : null,
          senderNumber:
            form.hasPaidRegistration && form.paymentMethod !== 'hand_to_hand'
              ? form.senderNumber
              : null,
          paymentNotes: form.hasPaidRegistration ? form.paymentNotes : null,
          group: form.group,
          whatsappNumber: form.whatsappNumber,
          phoneNumber: form.phoneNumber,
          boardRoll: form.boardRoll,
          season: form.season,
          bloodGroup: form.bloodGroup,
          nidOrBirthCertificate: nidOrBirthCertificateId,
          studentIdCard: studentIdCardId,
          passportSizeImage: passportSizeImageId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setError(payload?.error || 'Failed to save details')
        setIsSaving(false)
        return
      }

      setMessage('Registration details updated successfully')
      setIsEditing(false)
      setFiles({ nidOrBirthCertificate: null, studentIdCard: null, passportSizeImage: null })
      router.refresh()

      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSaving(false)
    }
  }

  const renderFilePreview = (
    file: File | null,
    existingUrl: string | undefined,
    label: string,
    fieldName: keyof typeof files,
  ) => (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {existingUrl && !files[fieldName] && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">Uploaded</span>
            </div>
            {isEditing && (
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-info hover:underline"
              >
                <Download className="h-4 w-4 inline mr-1" />
                View
              </a>
            )}
          </div>
        )}
        {files[fieldName] && (
          <div className="p-3 bg-info-soft rounded-lg">
            <p className="text-sm font-medium text-info-foreground">{files[fieldName]!.name}</p>
            <p className="text-xs text-info-foreground">Ready to upload</p>
          </div>
        )}
        {isEditing && (
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/30 p-4 transition-colors hover:bg-muted/50">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Click to upload</span>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, fieldName)}
              disabled={fileUploading[fieldName]}
              className="hidden"
            />
          </label>
        )}
      </div>
    </Field>
  )

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration Details</CardTitle>
              <CardDescription>Your official membership registration information</CardDescription>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Section */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3">Payment Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Registration Fee Paid</span>
                <Badge variant={profile.hasPaidRegistration ? 'default' : 'secondary'}>
                  {profile.hasPaidRegistration ? 'Yes' : 'No'}
                </Badge>
              </div>
              {profile.hasPaidRegistration && profile.paymentMethod && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method</span>
                    <span className="text-sm font-medium">
                      {{
                        bkash: 'bKash',
                        nagad: 'Nagad',
                        rocket: 'Rocket',
                        hand_to_hand: 'Hand to Hand Cash',
                        bank: 'Bank Transfer',
                      }[profile.paymentMethod] || profile.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {profile.paymentMethod !== 'hand_to_hand' && profile.paymentTransactionId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Transaction ID</span>
                      <span className="text-sm font-mono">{profile.paymentTransactionId}</span>
                    </div>
                  )}
                  {profile.paymentMethod !== 'hand_to_hand' && profile.senderNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sender Number</span>
                      <span className="text-sm font-mono">{profile.senderNumber}</span>
                    </div>
                  )}
                  {profile.paymentNotes && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Notes</span>
                      <span className="text-sm">{profile.paymentNotes}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.group && (
                <div>
                  <p className="text-xs text-muted-foreground">Group</p>
                  <p className="text-sm font-medium">{profile.group}</p>
                </div>
              )}
              {profile.whatsappNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp Number</p>
                  <p className="text-sm font-medium">{profile.whatsappNumber}</p>
                </div>
              )}
              {profile.phoneNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-medium">{profile.phoneNumber}</p>
                </div>
              )}
              {profile.boardRoll && (
                <div>
                  <p className="text-xs text-muted-foreground">Board/Class Roll</p>
                  <p className="text-sm font-medium">{profile.boardRoll}</p>
                </div>
              )}
              {profile.season && (
                <div>
                  <p className="text-xs text-muted-foreground">Season</p>
                  <p className="text-sm font-medium">{profile.season}</p>
                </div>
              )}
              {profile.bloodGroup && (
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-sm font-medium">{profile.bloodGroup}</p>
                </div>
              )}
              {profile.committeeRoles && profile.committeeRoles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Committee Roles</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.committeeRoles.map((cr, i) => (
                      <p key={i} className="text-sm font-medium">
                        {cr.committee?.name || 'Committee'}{cr.role ? ` - ${cr.role}` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3">Uploaded Documents</h3>
            <div className="space-y-3">
              {profile.nidOrBirthCertificate?.url && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">NID or Birth Certificate</span>
                  <a
                    href={profile.nidOrBirthCertificate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:underline"
                  >
                    View
                  </a>
                </div>
              )}
              {profile.studentIdCard?.url && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Student ID Card</span>
                  <a
                    href={profile.studentIdCard.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:underline"
                  >
                    View
                  </a>
                </div>
              )}
              {profile.passportSizeImage?.url && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Passport Size Image</span>
                  <a
                    href={profile.passportSizeImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:underline"
                  >
                    View
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const bkashNum = getPaymentNumber('bkash')
  const nagadNum = getPaymentNumber('nagad')
  const rocketNum = getPaymentNumber('rocket')
  const bankInfo = getBankInfo()
  const cashInstructions = paymentSettings?.cash?.instructions

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Registration Details</CardTitle>
            <CardDescription>Update your membership information</CardDescription>
          </div>
          <Button
            onClick={() => setIsEditing(false)}
            variant="outline"
            size="sm"
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <FieldGroup>
            {/* Payment Information Section */}
            {paymentSettings && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Info className="size-3" />
                  Payment Information
                </div>

                {bkashNum && paymentSettings.bkash?.enabled && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">bKash</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">{bkashNum}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => copyToClipboard(bkashNum, 'bkash')}
                      >
                        {showCopied === 'bkash' ? (
                          <CheckCircle2 className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                    {paymentSettings.bkash?.type && (
                      <p className="text-xs text-muted-foreground">
                        Type: {paymentSettings.bkash.type}
                      </p>
                    )}
                  </div>
                )}

                {nagadNum && paymentSettings.nagad?.enabled && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">Nagad</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">{nagadNum}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => copyToClipboard(nagadNum, 'nagad')}
                      >
                        {showCopied === 'nagad' ? (
                          <CheckCircle2 className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                    {paymentSettings.nagad?.type && (
                      <p className="text-xs text-muted-foreground">
                        Type: {paymentSettings.nagad.type}
                      </p>
                    )}
                  </div>
                )}

                {rocketNum && paymentSettings.rocket?.enabled && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">Rocket</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">{rocketNum}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => copyToClipboard(rocketNum, 'rocket')}
                      >
                        {showCopied === 'rocket' ? (
                          <CheckCircle2 className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                    {paymentSettings.rocket?.type && (
                      <p className="text-xs text-muted-foreground">
                        Type: {paymentSettings.rocket.type}
                      </p>
                    )}
                  </div>
                )}

                {cashInstructions && paymentSettings.cash?.enabled && (
                  <div className="space-y-1.5 border-t pt-2">
                    <div className="text-xs font-medium">Hand to Hand Cash</div>
                    <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {cashInstructions}
                    </p>
                  </div>
                )}

                {bankInfo && paymentSettings.bank?.enabled && (
                  <div className="space-y-1.5 border-t pt-2">
                    <div className="text-xs font-medium">Bank Transfer</div>
                    {bankInfo.accountName && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Account:</span> {bankInfo.accountName}
                      </div>
                    )}
                    {bankInfo.accountNumber && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Number:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{bankInfo.accountNumber}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1"
                            onClick={() =>
                              copyToClipboard(bankInfo.accountNumber || '', 'bank-account')
                            }
                          >
                            {showCopied === 'bank-account' ? (
                              <CheckCircle2 className="size-2.5 text-success" />
                            ) : (
                              <Copy className="size-2.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    {bankInfo.bankName && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Bank:</span> {bankInfo.bankName}
                      </div>
                    )}
                    {bankInfo.branch && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Branch:</span> {bankInfo.branch}
                      </div>
                    )}
                    {bankInfo.routing && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Routing:</span> {bankInfo.routing}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment Section */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="font-semibold">Payment Information</h3>
              <Field>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasPaidRegistration"
                    required
                    name="hasPaidRegistration"
                    checked={form.hasPaidRegistration}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-input"
                  />
                  <FieldLabel htmlFor="hasPaidRegistration" className="mb-0">
                    Have you paid the registration fee?
                  </FieldLabel>
                </div>
              </Field>

              {form.hasPaidRegistration && (
                <>
                  <Field>
                    <FieldLabel htmlFor="paymentMethod">Payment Method *</FieldLabel>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a payment method</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                      <option value="hand_to_hand">Hand to Hand Cash</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </Field>

                  {form.paymentMethod && form.paymentMethod !== 'hand_to_hand' && (
                    <Field>
                      <FieldLabel htmlFor="paymentTransactionId">Transaction ID *</FieldLabel>
                      <Input
                        id="paymentTransactionId"
                        name="paymentTransactionId"
                        placeholder="Enter transaction ID"
                        value={form.paymentTransactionId}
                        onChange={handleInputChange}
                      />
                    </Field>
                  )}
                  {form.paymentMethod && form.paymentMethod !== 'hand_to_hand' && (
                    <Field>
                      <FieldLabel htmlFor="senderNumber">Sender Number</FieldLabel>
                      <Input
                        id="senderNumber"
                        name="senderNumber"
                        placeholder="Enter sender mobile banking number"
                        value={form.senderNumber}
                        onChange={handleInputChange}
                      />
                    </Field>
                  )}
                  {form.hasPaidRegistration && (
                    <Field>
                      <FieldLabel htmlFor="paymentNotes">Payment Notes</FieldLabel>
                      <textarea
                        id="paymentNotes"
                        name="paymentNotes"
                        placeholder="Additional notes about payment"
                        value={form.paymentNotes}
                        onChange={handleInputChange}
                        className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      />
                    </Field>
                  )}
                </>
              )}
            </div>

            {/* Personal Information */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="font-semibold">Personal Information</h3>

              <Field>
                <FieldLabel htmlFor="group">Group / Batch *</FieldLabel>
                <Input
                  id="group"
                  name="group"
                  placeholder="e.g., 1/1/CST/A"
                  value={form.group}
                  onChange={handleInputChange}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="whatsappNumber">WhatsApp Number *</FieldLabel>
                  <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    placeholder="+880..."
                    value={form.whatsappNumber}
                    onChange={handleInputChange}
                    type="tel"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phoneNumber">Phone Number *</FieldLabel>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="+880..."
                    value={form.phoneNumber}
                    onChange={handleInputChange}
                    type="tel"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="boardRoll">Board Roll / Class Roll *</FieldLabel>
                  <Input
                    id="boardRoll"
                    name="boardRoll"
                    placeholder="Enter board or class roll"
                    value={form.boardRoll}
                    onChange={handleInputChange}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="season">Season / Batch *</FieldLabel>
                  <Input
                    id="season"
                    name="season"
                    placeholder="e.g., Spring 2024"
                    value={form.season}
                    onChange={handleInputChange}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="bloodGroup">Blood Group *</FieldLabel>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleInputChange}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select blood group</option>
                  <option value="a_plus">A+</option>
                  <option value="a_minus">A-</option>
                  <option value="b_plus">B+</option>
                  <option value="b_minus">B-</option>
                  <option value="ab_plus">AB+</option>
                  <option value="ab_minus">AB-</option>
                  <option value="o_plus">O+</option>
                  <option value="o_minus">O-</option>
                </select>
              </Field>
            </div>

            {/* Documents */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="font-semibold">Documents</h3>
              {renderFilePreview(
                files.nidOrBirthCertificate,
                profile.nidOrBirthCertificate?.url,
                'NID or Birth Certificate',
                'nidOrBirthCertificate',
              )}
              {renderFilePreview(
                files.studentIdCard,
                profile.studentIdCard?.url,
                'Student ID Card (Optional)',
                'studentIdCard',
              )}
              {renderFilePreview(
                files.passportSizeImage,
                profile.passportSizeImage?.url,
                'Passport Size Image',
                'passportSizeImage',
              )}
            </div>

            {/* Messages */}
            {error && (
              <Alert className="border-destructive-border bg-destructive-soft">
                <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-success-border bg-success-soft">
                <AlertDescription className="text-success-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving} size="lg">
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
