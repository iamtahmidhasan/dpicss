'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2, Copy, Info, QrCode } from 'lucide-react'
import { useLocale } from '@/components/Providers'

type PaymentSettings = {
  bkash?: { enabled?: boolean; number?: string; type?: string }
  nagad?: { enabled?: boolean; number?: string }
  rocket?: { enabled?: boolean; number?: string }
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

type CoursePaymentInfo = {
  useCustomPayment?: boolean
  bkashNumber?: string
  nagadNumber?: string
  rocketNumber?: string
  cashInstructions?: string
}

type CourseInfo = {
  id: string
  title: string
  price: number
  currency: string
  memberType: 'official' | 'unofficial' | 'both'
  paymentInfo?: CoursePaymentInfo
}

type EnrollmentDialogProps = {
  course: CourseInfo
  userEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollmentDialog({ course, userEmail, open, onOpenChange }: EnrollmentDialogProps) {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [paymentSettingsFetched, setPaymentSettingsFetched] = useState(false)
  const [formData, setFormData] = useState({
    paymentMethod: '',
    transactionId: '',
    senderNumber: '',
    notes: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCopied, setShowCopied] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const { locale } = useLocale()

  const t = useCallback((en: string, bn: string) => (locale === 'bn' ? bn : en), [locale])

  useEffect(() => {
    if (open && !paymentSettingsFetched) {
      setPaymentSettingsFetched(true)
      fetch('/api/payment-settings')
        .then((res) => res.json())
        .then((data) => {
          console.log('[EnrollmentDialog] Payment settings fetched:', data)
          setPaymentSettings(data || {})
        })
        .catch((err) => {
          console.error('[EnrollmentDialog] Failed to fetch payment settings:', err)
          setPaymentSettings({})
        })
    }
  }, [open, paymentSettingsFetched])

  useEffect(() => {
    if (!open) {
      setFormData({ paymentMethod: '', transactionId: '', senderNumber: '', notes: '' })
      setError('')
      setSuccess(false)
      setPaymentSettingsFetched(false)
    }
  }, [open])

  const getCoursePaymentNumber = useCallback(
    (method: string): string => {
      if (course.paymentInfo?.useCustomPayment) {
        switch (method) {
          case 'bkash':
            return course.paymentInfo.bkashNumber || ''
          case 'nagad':
            return course.paymentInfo.nagadNumber || ''
          case 'rocket':
            return course.paymentInfo.rocketNumber || ''
          default:
            return ''
        }
      }
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
    },
    [course.paymentInfo, paymentSettings],
  )

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: value }))
  }

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

  const isCash = formData.paymentMethod === 'cash'

  const getAvailableMethods = (): { value: string; label: string }[] => {
    const methods: { value: string; label: string }[] = []

    const bkashNum = getCoursePaymentNumber('bkash')
    const nagadNum = getCoursePaymentNumber('nagad')
    const rocketNum = getCoursePaymentNumber('rocket')

    const globalBkash = paymentSettings?.bkash?.enabled
    const globalNagad = paymentSettings?.nagad?.enabled
    const globalRocket = paymentSettings?.rocket?.enabled
    const globalCash = paymentSettings?.cash?.enabled
    const globalBank = paymentSettings?.bank?.enabled

    const useCustom = course.paymentInfo?.useCustomPayment

    if (useCustom) {
      if (bkashNum) methods.push({ value: 'bkash', label: 'bKash' })
      if (nagadNum) methods.push({ value: 'nagad', label: 'Nagad' })
      if (rocketNum) methods.push({ value: 'rocket', label: 'Rocket' })
    } else {
      if (globalBkash && bkashNum) methods.push({ value: 'bkash', label: 'bKash' })
      if (globalNagad && nagadNum) methods.push({ value: 'nagad', label: 'Nagad' })
      if (globalRocket && rocketNum) methods.push({ value: 'rocket', label: 'Rocket' })
    }

    if (globalCash || useCustom) methods.push({ value: 'cash', label: 'Cash Payment' })
    if (globalBank || useCustom) methods.push({ value: 'bank', label: 'Bank Transfer' })

    return methods
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const requestBody: Record<string, unknown> = {
        courseId: course.id,
        email: userEmail,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      }

      if (!isCash) {
        requestBody.transactionId = formData.transactionId
        requestBody.senderNumber = formData.senderNumber
      }

      const response = await fetch('/api/enrollment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to submit enrollment request')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const paymentNumber = getCoursePaymentNumber(formData.paymentMethod)
  const availableMethods = getAvailableMethods()
  const cashInstructions = course.paymentInfo?.useCustomPayment
    ? course.paymentInfo.cashInstructions
    : paymentSettings?.cash?.instructions

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100vw-40px)] max-w-sm overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('Request Submitted!', 'অনুরোধ জমা হয়েছে!')}</DialogTitle>
            <DialogDescription>
              {t(
                'Your enrollment request has been submitted for admin review. You will be notified once approved.',
                'আপনার নিবন্ধন অনুরোধ প্রশাসকের পর্যালোচনার জন্য জমা করা হয়েছে। অনুমোদন হলে আপনাকে জানানো হবে।',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-6 text-green-600" />
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <Info className="size-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    {t('What happens next?', 'পরবর্তী পদক্ষেপ কী?')}
                  </p>
                  <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                    <li>
                      {t(
                        'Admin will review your payment details',
                        'প্রশাসক আপনার পেমেন্ট বিবরণ পর্যালোচনা করবেন',
                      )}
                    </li>
                    <li>
                      {t('Approval may take 24-48 hours', 'অনুমোদনে ২৪-৪৮ ঘন্টা সময় লাগতে পারে')}
                    </li>
                    <li>
                      {t('You will be notified upon approval', 'অনুমোদনের পর আপনাকে জানানো হবে')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button onClick={handleClose} className="w-full">
              {t('OK', 'ঠিক আছে')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-40px)] max-w-sm overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t(`Enroll in ${course.title}`, `কোর্সে নিবন্ধন করুন`)}</DialogTitle>
          <DialogDescription>
            {t(
              'Complete your payment and submit enrollment request for admin review.',
              'আপনার পেমেন্ট সম্পন্ন করুন এবং প্রশাসকের পর্যালোচনার জন্য নিবন্ধন অনুরোধ জমা দিন।',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Course Price</span>
              <span className="text-lg font-bold">
                {course.currency === 'USD' ? '$' : '৳'}
                {course.price}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Info className="size-3" />
              {t('Payment Information', 'পেমেন্ট তথ্য')}
            </div>

            {/* Mobile Money Methods */}
            {availableMethods.some((m) => m.value === 'bkash') &&
              getCoursePaymentNumber('bkash') && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium">{t('bKash', 'বিকাশ')}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium">{getCoursePaymentNumber('bkash')}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      onClick={() => copyToClipboard(getCoursePaymentNumber('bkash'), 'bkash')}
                    >
                      {showCopied === 'bkash' ? (
                        <CheckCircle2 className="size-3 text-green-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                  {paymentSettings?.bkash?.type && (
                    <p className="text-xs text-muted-foreground">
                      {t('Type:', 'টাইপ:')} {paymentSettings.bkash.type}
                    </p>
                  )}
                </div>
              )}

            {availableMethods.some((m) => m.value === 'nagad') &&
              getCoursePaymentNumber('nagad') && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium">{t('Nagad', 'নগদ')}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium">{getCoursePaymentNumber('nagad')}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      onClick={() => copyToClipboard(getCoursePaymentNumber('nagad'), 'nagad')}
                    >
                      {showCopied === 'nagad' ? (
                        <CheckCircle2 className="size-3 text-green-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

            {availableMethods.some((m) => m.value === 'rocket') &&
              getCoursePaymentNumber('rocket') && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium">{t('Rocket', 'রকেট')}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium">
                      {getCoursePaymentNumber('rocket')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      onClick={() => copyToClipboard(getCoursePaymentNumber('rocket'), 'rocket')}
                    >
                      {showCopied === 'rocket' ? (
                        <CheckCircle2 className="size-3 text-green-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

            {/* Cash Payment */}
            {availableMethods.some((m) => m.value === 'cash') && cashInstructions && (
              <div className="space-y-1.5 border-t pt-2">
                <div className="text-xs font-medium">{t('Cash Payment', 'নগদ অর্থ প্রদান')}</div>
                <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                  {cashInstructions}
                </p>
              </div>
            )}

            {/* Bank Transfer */}
            {availableMethods.some((m) => m.value === 'bank') && paymentSettings?.bank?.enabled && (
              <div className="space-y-1.5 border-t pt-2">
                <div className="text-xs font-medium">{t('Bank Transfer', 'ব্যাংক স্থানান্তর')}</div>
                {paymentSettings.bank.accountName && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t('Account:', 'অ্যাকাউন্ট:')}</span>{' '}
                    {paymentSettings.bank.accountName}
                  </div>
                )}
                {paymentSettings.bank.accountNumber && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('Number:', 'সংখ্যা:')}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{paymentSettings.bank.accountNumber}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1"
                        onClick={() =>
                          copyToClipboard(paymentSettings.bank?.accountNumber || '', 'bank-account')
                        }
                      >
                        {showCopied === 'bank-account' ? (
                          <CheckCircle2 className="size-2.5 text-green-600" />
                        ) : (
                          <Copy className="size-2.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {paymentSettings.bank.bankName && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t('Bank:', 'ব্যাংক:')}</span>{' '}
                    {paymentSettings.bank.bankName}
                  </div>
                )}
                {paymentSettings.bank.branch && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t('Branch:', 'শাখা:')}</span>{' '}
                    {paymentSettings.bank.branch}
                  </div>
                )}
                {paymentSettings.bank.routing && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('Routing:', 'রুটিং:')}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{paymentSettings.bank.routing}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1"
                        onClick={() =>
                          copyToClipboard(paymentSettings.bank?.routing || '', 'bank-routing')
                        }
                      >
                        {showCopied === 'bank-routing' ? (
                          <CheckCircle2 className="size-2.5 text-green-600" />
                        ) : (
                          <Copy className="size-2.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div ref={formRef} className="space-y-4">
            <Field>
              <Label htmlFor="email">{t('Email', 'ইমেইল')}</Label>
              <Input id="email" value={userEmail} disabled className="bg-muted" />
            </Field>

            <Field>
              <Label htmlFor="paymentMethod">{t('Payment Method', 'পেমেন্ট পদ্ধতি')}</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={handlePaymentMethodChange}
                required
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue
                    placeholder={t('Select payment method', 'পেমেন্ট পদ্ধতি নির্বাচন করুন')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {!isCash && formData.paymentMethod !== '' && (
              <>
                {paymentNumber && (
                  <Field>
                    <Label>{t('Send Money To', 'টাকা পাঠান')}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={paymentNumber}
                        disabled
                        className="bg-muted font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentNumber, 'payment')}
                        className="shrink-0"
                      >
                        {showCopied === 'payment' ? (
                          <CheckCircle2 className="size-4 text-green-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                    {formData.paymentMethod === 'bkash' && paymentSettings?.bkash?.type && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Type:', 'টাইপ:')} {paymentSettings.bkash.type}
                      </p>
                    )}
                  </Field>
                )}

                <Field>
                  <Label htmlFor="senderNumber">{t('Sender Number', 'প্রেরক নম্বর')}</Label>
                  <Input
                    id="senderNumber"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={formData.senderNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, senderNumber: e.target.value }))
                    }
                    required
                    className="text-sm"
                  />
                </Field>

                <Field>
                  <Label htmlFor="transactionId">{t('Transaction ID', 'লেনদেন আইডি')}</Label>
                  <Input
                    id="transactionId"
                    placeholder={t('Last 8 digits', 'শেষ ৮ সংখ্যা')}
                    value={formData.transactionId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, transactionId: e.target.value }))
                    }
                    required
                    maxLength={8}
                    pattern="[0-9]{8}"
                    className="text-sm font-mono"
                  />
                  <FieldDescription className="text-xs">
                    {t(
                      'Found in payment confirmation SMS',
                      'পেমেন্ট নিশ্চিতকরণ এসএমএস এ পাওয়া যাবে',
                    )}
                  </FieldDescription>
                </Field>

                {formData.paymentMethod === 'bank' && paymentSettings?.bank && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <p className="font-medium text-xs text-muted-foreground">
                      {t('Bank Transfer Details', 'ব্যাংক ট্রান্সফার বিবরণ')}
                    </p>
                    <p>
                      {t('Bank:', 'ব্যাংক:')} {paymentSettings.bank.bankName}
                    </p>
                    <p>
                      {t('Account:', 'অ্যাকাউন্ট:')} {paymentSettings.bank.accountNumber}
                    </p>
                    {paymentSettings.bank.branch && (
                      <p>
                        {t('Branch:', 'শাখা:')} {paymentSettings.bank.branch}
                      </p>
                    )}
                    {paymentSettings.bank.routing && (
                      <p>
                        {t('Routing:', 'রাউটিং:')} {paymentSettings.bank.routing}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {isCash && cashInstructions && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('Cash Payment Instructions', 'নগদ পেমেন্ট নির্দেশনা')}
                </p>
                <p className="text-sm">{cashInstructions}</p>
              </div>
            )}

            <Field>
              <Label htmlFor="notes">
                {t('Additional Notes (Optional)', 'অতিরিক্ত নোট (ঐচ্ছিক)')}
              </Label>
              <Input
                id="notes"
                placeholder={t('Any additional information...', 'অতিরিক্ত তথ্য...')}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-sm"
              />
            </Field>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md dark:bg-red-950">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-none">
                {t('Cancel', 'বাতিল')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="flex-none">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  {t('Submitting...', 'জমা দিচ্ছি...')}
                </span>
              ) : (
                t('Submit Request', 'অনুরোধ জমা দিন')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
