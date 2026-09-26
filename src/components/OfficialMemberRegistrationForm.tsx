'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Copy, Info, Upload } from 'lucide-react'
import { useLocale } from '@/components/Providers'

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
  nidOrBirthCertificate: File | null
  studentIdCard: File | null
  passportSizeImage: File | null
}

type FileUploadState = {
  nidOrBirthCertificate: boolean
  studentIdCard: boolean
  passportSizeImage: boolean
}

export function OfficialMemberRegistrationForm() {
  const router = useRouter()
  const { locale } = useLocale()
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [step, setStep] = useState<'form' | 'uploading' | 'complete'>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCopied, setShowCopied] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState<FileUploadState>({
    nidOrBirthCertificate: false,
    studentIdCard: false,
    passportSizeImage: false,
  })

  const t = useCallback((en: string, bn: string) => (locale === 'bn' ? bn : en), [locale])

  const [form, setForm] = useState<FormState>({
    hasPaidRegistration: false,
    paymentMethod: '',
    paymentTransactionId: '',
    senderNumber: '',
    paymentNotes: '',
    group: '',
    whatsappNumber: '',
    phoneNumber: '',
    boardRoll: '',
    season: '',
    bloodGroup: '',
    nidOrBirthCertificate: null,
    studentIdCard: null,
    passportSizeImage: null,
  })

  useEffect(() => {
    fetch('/api/payment-settings')
      .then((res) => res.json())
      .then((data) => setPaymentSettings(data || {}))
      .catch(() => setPaymentSettings({}))
  }, [])

  const isOnlinePayment = ['bkash', 'nagad', 'rocket'].includes(form.paymentMethod)
  const isCash = form.paymentMethod === 'hand_to_hand'
  const isBank = form.paymentMethod === 'bank'

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

  const cashInstructions = paymentSettings?.cash?.instructions

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

  const needsTransactionId = isOnlinePayment || isBank

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormState) => {
    const file = e.target.files?.[0] || null
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setForm((prev) => ({
        ...prev,
        [fieldName]: file,
      }))
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

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      const payload = await response.json().catch(() => null)
      return String(payload?.doc?.id || payload?.id || '')
    } catch (err) {
      console.error(`Failed to upload ${fieldName}:`, err)
      throw new Error(`Failed to upload ${fieldName}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      setError('Board roll / Class roll is required')
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
    if (!form.nidOrBirthCertificate) {
      setError('NID or Birth Certificate is required')
      return
    }
    if (!form.passportSizeImage) {
      setError('Passport size image is required')
      return
    }

    if (form.hasPaidRegistration) {
      if (!form.paymentMethod) {
        setError('Payment method is required')
        return
      }
      if (needsTransactionId && !form.paymentTransactionId.trim()) {
        setError('Transaction ID is required for this payment method')
        return
      }
    }

    setIsLoading(true)
    setStep('uploading')

    try {
      const csrfToken = await getCsrfToken()

      let nidOrBirthCertificateId: string | null = null
      let studentIdCardId: string | null = null
      let passportSizeImageId: string | null = null

      if (form.nidOrBirthCertificate) {
        setFileUploading((prev) => ({ ...prev, nidOrBirthCertificate: true }))
        nidOrBirthCertificateId = await uploadFile(
          form.nidOrBirthCertificate,
          'nidOrBirthCertificate',
          'NID or Birth Certificate',
        )
        setFileUploading((prev) => ({ ...prev, nidOrBirthCertificate: false }))
      }

      if (form.studentIdCard) {
        setFileUploading((prev) => ({ ...prev, studentIdCard: true }))
        studentIdCardId = await uploadFile(form.studentIdCard, 'studentIdCard', 'Student ID Card')
        setFileUploading((prev) => ({ ...prev, studentIdCard: false }))
      }

      if (form.passportSizeImage) {
        setFileUploading((prev) => ({ ...prev, passportSizeImage: true }))
        passportSizeImageId = await uploadFile(
          form.passportSizeImage,
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
            form.hasPaidRegistration && needsTransactionId ? form.paymentTransactionId : null,
          senderNumber: form.hasPaidRegistration && isOnlinePayment ? form.senderNumber : null,
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
        setError(payload?.error || 'Failed to save member details')
        setStep('form')
        setIsLoading(false)
        return
      }

      setStep('complete')

      setTimeout(() => {
        const profileUsername = payload?.profileUsername as string | undefined
        if (profileUsername) {
          router.push(`/profile/${encodeURIComponent(profileUsername)}`)
        } else {
          router.push('/account')
        }
      }, 2000)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
      setIsLoading(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 pt-8">
            <div className="rounded-full bg-success-muted p-3">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-center">Registration Complete!</h2>
            <p className="text-center text-muted-foreground">
              Your official member profile has been created. Redirecting to your profile...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bkashNum = getPaymentNumber('bkash')
  const nagadNum = getPaymentNumber('nagad')
  const rocketNum = getPaymentNumber('rocket')
  const bankInfo = getBankInfo()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        <p className="text-muted-foreground">
          Please provide the following information to complete your official member registration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>
            Fill in all required fields to complete your membership registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              {/* Payment Information Section */}
              {paymentSettings && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Info className="size-3" />
                    {t('Payment Information', 'পেমেন্ট তথ্য')}
                  </div>

                  {bkashNum && paymentSettings.bkash?.enabled && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium">{t('bKash', 'বিকাশ')}</div>
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
                          {t('Type:', 'টাইপ:')} {paymentSettings.bkash.type}
                        </p>
                      )}
                    </div>
                  )}

                  {nagadNum && paymentSettings.nagad?.enabled && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium">{t('Nagad', 'নগদ')}</div>
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
                          {t('Type:', 'টাইপ:')} {paymentSettings.nagad.type}
                        </p>
                      )}
                    </div>
                  )}

                  {rocketNum && paymentSettings.rocket?.enabled && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium">{t('Rocket', 'রকেট')}</div>
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
                          {t('Type:', 'টাইপ:')} {paymentSettings.rocket.type}
                        </p>
                      )}
                    </div>
                  )}

                  {cashInstructions && paymentSettings.cash?.enabled && (
                    <div className="space-y-1.5 border-t pt-2">
                      <div className="text-xs font-medium">
                        {t('Hand to Hand Cash', 'হাতে হাতে নগদ')}
                      </div>
                      <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                        {cashInstructions}
                      </p>
                    </div>
                  )}

                  {bankInfo && paymentSettings.bank?.enabled && (
                    <div className="space-y-1.5 border-t pt-2">
                      <div className="text-xs font-medium">
                        {t('Bank Transfer', 'ব্যাংক ট্রান্সফার')}
                      </div>
                      {bankInfo.accountName && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{t('Account:', 'অ্যাকাউন্ট:')}</span>{' '}
                          {bankInfo.accountName}
                        </div>
                      )}
                      {bankInfo.accountNumber && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t('Number:', 'সংখ্যা:')}</span>
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
                          <span className="font-medium">{t('Bank:', 'ব্যাংক:')}</span>{' '}
                          {bankInfo.bankName}
                        </div>
                      )}
                      {bankInfo.branch && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{t('Branch:', 'শাখা:')}</span>{' '}
                          {bankInfo.branch}
                        </div>
                      )}
                      {bankInfo.routing && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{t('Routing:', 'রুটিং:')}</span>{' '}
                          {bankInfo.routing}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Registration Payment</h3>
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
                      <Field className="mt-4">
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

                      {/* Payment Info Cards - Shown after method selection */}
                      {isOnlinePayment && getPaymentNumber(form.paymentMethod) && (
                        <div className="rounded-lg border  p-3 space-y-2">
                          <p className="text-sm font-medium ">
                            {t('Send money to this number', 'এই নম্বরে টাকা পাঠান')}
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={getPaymentNumber(form.paymentMethod)}
                              disabled
                              className="bg-white font-mono text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  getPaymentNumber(form.paymentMethod),
                                  'payment-number',
                                )
                              }
                              className="shrink-0"
                            >
                              {showCopied === 'payment-number' ? (
                                <CheckCircle2 className="size-4 text-success" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                          </div>
                          {form.paymentMethod === 'bkash' && paymentSettings?.bkash?.type && (
                            <p className="text-xs text-info-foreground">
                              {t('Type:', 'টাইপ:')} {paymentSettings.bkash.type}
                            </p>
                          )}
                          {form.paymentMethod === 'nagad' && paymentSettings?.nagad?.type && (
                            <p className="text-xs text-info-foreground">
                              {t('Type:', 'টাইপ:')} {paymentSettings.nagad.type}
                            </p>
                          )}
                          {form.paymentMethod === 'rocket' && paymentSettings?.rocket?.type && (
                            <p className="text-xs text-info-foreground">
                              {t('Type:', 'টাইপ:')} {paymentSettings.rocket.type}
                            </p>
                          )}
                        </div>
                      )}

                      {isCash && cashInstructions && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {t('Cash Payment Instructions', 'নগদ পেমেন্ট নির্দেশনা')}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{cashInstructions}</p>
                        </div>
                      )}

                      {isBank && bankInfo && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                          <p className="font-medium text-xs text-muted-foreground">
                            {t('Bank Transfer Details', 'ব্যাংক ট্রান্সফার বিবরণ')}
                          </p>
                          {bankInfo.accountName && (
                            <p>
                              {t('Account:', 'অ্যাকাউন্ট:')} {bankInfo.accountName}
                            </p>
                          )}
                          {bankInfo.accountNumber && (
                            <p>
                              {t('Account No:', 'অ্যাকাউন্ট নং:')} {bankInfo.accountNumber}
                            </p>
                          )}
                          {bankInfo.bankName && (
                            <p>
                              {t('Bank:', 'ব্যাংক:')} {bankInfo.bankName}
                            </p>
                          )}
                          {bankInfo.branch && (
                            <p>
                              {t('Branch:', 'শাখা:')} {bankInfo.branch}
                            </p>
                          )}
                          {bankInfo.routing && (
                            <p>
                              {t('Routing:', 'রুটিং:')} {bankInfo.routing}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Sender Number - for online payments */}
                      {isOnlinePayment && (
                        <Field>
                          <FieldLabel htmlFor="senderNumber">
                            {t('Sender Number', 'প্রেরক নম্বর')}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="senderNumber"
                            name="senderNumber"
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            value={form.senderNumber}
                            onChange={handleInputChange}
                          />
                          <FieldDescription>
                            {t(
                              'Your mobile banking account number used for payment',
                              'পেমেন্টের জন্য ব্যবহৃত আপনার মোবাইল ব্যাংকিং অ্যাকাউন্ট নম্বর',
                            )}
                          </FieldDescription>
                        </Field>
                      )}

                      {/* Transaction ID - for online payments */}
                      {needsTransactionId && (
                        <Field>
                          <FieldLabel htmlFor="paymentTransactionId">
                            {t('Transaction ID', 'লেনদেন আইডি')}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="paymentTransactionId"
                            name="paymentTransactionId"
                            placeholder={
                              isOnlinePayment
                                ? t('Last 8 digits', 'শেষ ৮ সংখ্যা')
                                : t('Enter transaction ID', 'লেনদেন আইডি লিখুন')
                            }
                            value={form.paymentTransactionId}
                            onChange={handleInputChange}
                            className={isOnlinePayment ? 'font-mono' : ''}
                          />
                          <FieldDescription>
                            {t(
                              'Transaction ID from your payment receipt',
                              'আপনার পেমেন্ট রশিদ থেকে লেনদেন আইডি',
                            )}
                          </FieldDescription>
                        </Field>
                      )}

                      {/* Payment Notes */}
                      <Field>
                        <FieldLabel htmlFor="paymentNotes">
                          {t('Additional Notes (Optional)', 'অতিরিক্ত নোট (ঐচ্ছিক)')}
                        </FieldLabel>
                        <textarea
                          id="paymentNotes"
                          name="paymentNotes"
                          value={form.paymentNotes}
                          onChange={handleInputChange}
                          placeholder={t(
                            'Any additional information about your payment...',
                            'আপনার পেমেন্ট সম্পর্কে অতিরিক্ত তথ্য...',
                          )}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>

                <Field>
                  <FieldLabel htmlFor="group">Group / Batch *</FieldLabel>
                  <Input
                    id="group"
                    name="group"
                    placeholder="e.g., 1/1/CST/A"
                    value={form.group}
                    onChange={handleInputChange}
                  />
                  <FieldDescription>Your group or batch information</FieldDescription>
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

              {/* Document Uploads */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <h3 className="font-semibold text-lg">Document Verification</h3>

                <Field>
                  <FieldLabel htmlFor="nidOrBirthCertificate" className="flex items-center gap-2">
                    NID or Birth Certificate
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {form.nidOrBirthCertificate
                            ? form.nidOrBirthCertificate.name
                            : 'Click to upload'}
                        </span>
                      </div>
                      <input
                        id="nidOrBirthCertificate"
                        name="nidOrBirthCertificate"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'nidOrBirthCertificate')}
                        disabled={fileUploading.nidOrBirthCertificate}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <FieldDescription>PNG, JPG, or PDF (max 5MB)</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="studentIdCard">Student ID Card (Optional)</FieldLabel>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {form.studentIdCard ? form.studentIdCard.name : 'Click to upload'}
                        </span>
                      </div>
                      <input
                        id="studentIdCard"
                        name="studentIdCard"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'studentIdCard')}
                        disabled={fileUploading.studentIdCard}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <FieldDescription>PNG, JPG, or PDF (max 5MB)</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="passportSizeImage" className="flex items-center gap-2">
                    Passport Size Image (4x6 cm)
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {form.passportSizeImage ? form.passportSizeImage.name : 'Click to upload'}
                        </span>
                      </div>
                      <input
                        id="passportSizeImage"
                        name="passportSizeImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'passportSizeImage')}
                        disabled={fileUploading.passportSizeImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <FieldDescription>PNG or JPG (max 5MB)</FieldDescription>
                </Field>
              </div>

              {error && (
                <Alert className="border-destructive-border bg-destructive-soft">
                  <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
                </Alert>
              )}

              {step === 'uploading' && (
                <Alert className="border-info-border bg-info-soft">
                  <AlertDescription className="text-info-foreground flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Uploading documents and saving your information...
                  </AlertDescription>
                </Alert>
              )}

              <Field>
                <Button type="submit" disabled={isLoading || step === 'uploading'} size="lg">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      Processing...
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
