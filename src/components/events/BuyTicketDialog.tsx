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
import { Field, FieldDescription } from '@/components/ui/field'
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
import { AlertCircle, CheckCircle2, Copy, Ticket, Info } from 'lucide-react'
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

type BankInfo = {
  accountName?: string
  accountNumber?: string
  bankName?: string
  branch?: string
  routing?: string
}

type EventData = {
  id: string
  name?: unknown
  ticketPrice?: number
  ticketCurrency?: string
  paymentMethods?: { method: string; accountNumber?: string }[]
  totalSeats?: number
  soldSeats?: number
}

type BuyTicketDialogProps = {
  event: EventData
  isLoggedIn: boolean
  userEmail?: string
  userName?: string
  messages: {
    buyTicket: string
    close: string
    submit: string
    loginRequired: string
    loginFirst: string
    buyerName: string
    buyerNamePlaceholder: string
    buyerEmail: string
    buyerEmailPlaceholder: string
    buyerPhone: string
    buyerPhonePlaceholder: string
    paymentMethod: string
    selectPaymentMethod: string
    transactionId: string
    transactionIdPlaceholder: string
    transactionIdHelp: string
    total: string
    success: string
    successMessage: string
    error: string
    errorMessage: string
    soldOut: string
    notAvailable: string
  }
}

export function BuyTicketDialog({
  event,
  isLoggedIn,
  userEmail,
  userName,
  messages,
}: BuyTicketDialogProps) {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [paymentSettingsFetched, setPaymentSettingsFetched] = useState(false)
  const [formData, setFormData] = useState({
    buyerName: userName || '',
    buyerEmail: userEmail || '',
    buyerPhone: '',
    paymentMethod: '',
    transactionId: '',
    senderNumber: '',
    notes: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
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
          setPaymentSettings(data || {})
        })
        .catch(() => {
          setPaymentSettings({})
        })
    }
  }, [open, paymentSettingsFetched])

  useEffect(() => {
    if (!open) {
      setFormData({
        buyerName: userName || '',
        buyerEmail: userEmail || '',
        buyerPhone: '',
        paymentMethod: '',
        transactionId: '',
        senderNumber: '',
        notes: '',
      })
      setError('')
      setSuccess(false)
      setEnrollmentId(null)
      setPaymentSettingsFetched(false)
    }
  }, [open, userName, userEmail])

  const getPaymentNumber = useCallback(
    (method: string): string => {
      const eventMethod = (event.paymentMethods || []).find(
        (pm) => pm.method.toLowerCase() === method.toLowerCase(),
      )
      if (eventMethod?.accountNumber) {
        return eventMethod.accountNumber
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
    [paymentSettings, event.paymentMethods],
  )

  const getBankInfo = useCallback((): BankInfo | undefined => {
    return paymentSettings?.bank
  }, [paymentSettings])

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

  const getAvailableMethods = (): { value: string; label: string }[] => {
    const methods: { value: string; label: string }[] = []

    if (!paymentSettings) return methods

    const eventMethods = (event.paymentMethods || []).map((pm) => pm.method.toLowerCase())
    const hasMethod = (m: string) => eventMethods.includes(m)

    const bkashNum = getPaymentNumber('bkash')
    const nagadNum = getPaymentNumber('nagad')
    const rocketNum = getPaymentNumber('rocket')
    const globalBkash = paymentSettings?.bkash?.enabled
    const globalNagad = paymentSettings?.nagad?.enabled
    const globalRocket = paymentSettings?.rocket?.enabled
    const globalCash = paymentSettings?.cash?.enabled
    const globalBank = paymentSettings?.bank?.enabled

    if ((hasMethod('bkash') || globalBkash) && bkashNum) {
      methods.push({ value: 'bkash', label: 'bKash' })
    }
    if ((hasMethod('nagad') || globalNagad) && nagadNum) {
      methods.push({ value: 'nagad', label: 'Nagad' })
    }
    if ((hasMethod('rocket') || globalRocket) && rocketNum) {
      methods.push({ value: 'rocket', label: 'Rocket' })
    }
    if (hasMethod('hand_to_hand') || globalCash) {
      methods.push({ value: 'hand_to_hand', label: t('Hand to Hand Cash', 'হাতে হাতে নগদ') })
    }
    if (hasMethod('bank') || globalBank) {
      methods.push({ value: 'bank', label: t('Bank Transfer', 'ব্যাংক ট্রান্সফার') })
    }

    return methods
  }

  const currency = event.ticketCurrency === 'USD' ? '$' : '৳'
  const ticketPrice = event.ticketPrice || 0
  const availableSeats = Math.max(0, (event.totalSeats || 0) - (event.soldSeats || 0))
  const isSoldOut = availableSeats === 0
  const isOnlinePayment = ['bkash', 'nagad', 'rocket'].includes(formData.paymentMethod)
  const isCash = formData.paymentMethod === 'hand_to_hand'
  const isBank = formData.paymentMethod === 'bank'
  const paymentNumber = getPaymentNumber(formData.paymentMethod)
  const bankInfo = getBankInfo()
  const availableMethods = getAvailableMethods()

  const cashInstructions = (() => {
    const eventCash = (event.paymentMethods || []).find(
      (pm) => pm.method.toLowerCase() === 'hand_to_hand',
    )
    if (eventCash?.accountNumber) return eventCash.accountNumber
    return paymentSettings?.cash?.instructions
  })()

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value,
      transactionId: '',
      senderNumber: '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.buyerName || !formData.buyerEmail || !formData.buyerPhone) {
        throw new Error('Please fill in all required fields')
      }

      if (!formData.paymentMethod) {
        throw new Error('Please select a payment method')
      }

      if (isOnlinePayment && !formData.transactionId) {
        throw new Error('Transaction ID is required for online payments')
      }

      const requestBody: Record<string, unknown> = {
        eventId: event.id,
        buyerName: formData.buyerName,
        buyerEmail: formData.buyerEmail,
        buyerPhone: formData.buyerPhone,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || '',
      }

      if (isOnlinePayment) {
        requestBody.transactionId = formData.transactionId
        requestBody.senderNumber = formData.senderNumber
      }

      const response = await fetch('/api/tickets/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || messages.errorMessage)
      }

      setSuccess(true)
      setEnrollmentId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : messages.errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Button size="lg" className="w-full" onClick={() => (window.location.href = '/login')}>
        <Ticket className="mr-2 size-5" />
        {messages.loginRequired}
      </Button>
    )
  }

  if (isSoldOut) {
    return (
      <Button size="lg" className="w-full" disabled>
        <Ticket className="mr-2 size-5" />
        {messages.soldOut}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="w-full">
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          <Ticket className="mr-2 size-5" />
          {messages.buyTicket}
        </Button>
      </div>

      <DialogContent ref={formRef} className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        {success ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-6 text-green-600" />
              </div>
              <DialogTitle className="text-center">{messages.success}</DialogTitle>
              <DialogDescription className="text-center">
                {messages.successMessage}
                {enrollmentId && (
                  <span className="mt-2 block font-mono text-sm text-foreground">
                    ID: {enrollmentId}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="w-full">
                {messages.close}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{messages.buyTicket}</DialogTitle>
              <DialogDescription>
                {currency}
                {ticketPrice}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Buyer Information */}
              <div className="grid gap-2">
                <Label htmlFor="buyerName">
                  {messages.buyerName}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="buyerName"
                  placeholder={messages.buyerNamePlaceholder}
                  value={formData.buyerName}
                  required
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="buyerEmail">
                  {messages.buyerEmail}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  placeholder={messages.buyerEmailPlaceholder}
                  value={formData.buyerEmail}
                  required
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="buyerPhone">
                  {messages.buyerPhone}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  placeholder={messages.buyerPhonePlaceholder}
                  value={formData.buyerPhone}
                  onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Payment Information Section */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Info className="size-3" />
                  {t('Payment Information', 'পেমেন্ট তথ্য')}
                </div>

                {getPaymentNumber('bkash') && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">{t('bKash', 'বিকাশ')}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">{getPaymentNumber('bkash')}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => copyToClipboard(getPaymentNumber('bkash'), 'bkash')}
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

                {getPaymentNumber('nagad') && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">{t('Nagad', 'নগদ')}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">{getPaymentNumber('nagad')}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => copyToClipboard(getPaymentNumber('nagad'), 'nagad')}
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

                {getPaymentNumber('rocket') && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">{t('Rocket', 'রকেট')}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-medium">{getPaymentNumber('rocket')}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => copyToClipboard(getPaymentNumber('rocket'), 'rocket')}
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
                {cashInstructions && (
                  <div className="space-y-1.5 border-t pt-2">
                    <div className="text-xs font-medium">
                      {t('Hand to Hand Cash', 'হাতে হাতে নগদ')}
                    </div>
                    <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {cashInstructions}
                    </p>
                  </div>
                )}

                {/* Bank Transfer */}
                {bankInfo && (
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
                              <CheckCircle2 className="size-2.5 text-green-600" />
                            ) : (
                              <Copy className="size-2.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    {bankInfo.bankName && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{t('Bank:', 'ব্যাংক:')}</span> {bankInfo.bankName}
                      </div>
                    )}
                    {bankInfo.branch && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{t('Branch:', 'শাখা:')}</span> {bankInfo.branch}
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

              {/* Payment Method Selection */}
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">
                  {messages.paymentMethod}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder={messages.selectPaymentMethod} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Details - Shown after method selection */}
              {formData.paymentMethod !== '' && isOnlinePayment && paymentNumber && (
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">
                    {t('Send money to this number', 'এই নম্বরে টাকা পাঠান')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={paymentNumber}
                      disabled
                      className="bg-muted font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentNumber, 'payment-number')}
                      className="shrink-0"
                    >
                      {showCopied === 'payment-number' ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                  {formData.paymentMethod === 'bkash' && paymentSettings?.bkash?.type && (
                    <p className="text-xs text-muted-foreground">
                      {t('Type:', 'টাইপ:')} {paymentSettings.bkash.type}
                    </p>
                  )}
                </div>
              )}

              {formData.paymentMethod !== '' && isCash && cashInstructions && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('Cash Payment Instructions', 'নগদ পেমেন্ট নির্দেশনা')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{cashInstructions}</p>
                </div>
              )}

              {formData.paymentMethod !== '' && isBank && bankInfo && (
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
                <div className="grid gap-2">
                  <Label htmlFor="senderNumber">
                    {t('Sender Number', 'প্রেরক নম্বর')}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="senderNumber"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={formData.senderNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, senderNumber: e.target.value }))
                    }
                    required
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Transaction ID - for online payments */}
              {isOnlinePayment && (
                <div className="grid gap-2">
                  <Label htmlFor="transactionId">
                    {messages.transactionId}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="transactionId"
                    placeholder={messages.transactionIdPlaceholder}
                    value={formData.transactionId}
                    onChange={(e) =>
                      setFormData({ ...formData, transactionId: e.target.value })
                    }
                    required={isOnlinePayment}
                    disabled={isLoading}
                    maxLength={8}
                    pattern="[0-9]{8}"
                    className="text-sm font-mono"
                  />
                  <FieldDescription className="text-xs">
                    {messages.transactionIdHelp}
                  </FieldDescription>
                </div>
              )}

              {/* Transaction ID for bank payments */}
              {isBank && (
                <div className="grid gap-2">
                  <Label htmlFor="transactionId-bank">
                    {messages.transactionId}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="transactionId-bank"
                    placeholder={messages.transactionIdPlaceholder}
                    value={formData.transactionId}
                    onChange={(e) =>
                      setFormData({ ...formData, transactionId: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <FieldDescription className="text-xs">
                    {messages.transactionIdHelp}
                  </FieldDescription>
                </div>
              )}

              {/* Additional Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes">
                  {t('Additional Notes (Optional)', 'অতিরিক্ত নোট (ঐচ্ছিক)')}
                </Label>
                <Input
                  id="notes"
                  placeholder={t('Any additional information...', 'অতিরিক্ত তথ্য...')}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  disabled={isLoading}
                  className="text-sm"
                />
              </div>

              {/* Price Summary */}
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('1 Ticket', '১ টি টিকিট')}</span>
                    <span>
                      {currency}
                      {ticketPrice}
                    </span>
                  </div>
                  <div className="border-t border-muted-foreground/20 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{messages.total}:</span>
                      <span className="text-xl font-bold">
                        {currency}
                        {ticketPrice}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md dark:bg-red-950">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={isLoading}>
                  {messages.close}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.paymentMethod ||
                  !formData.buyerName ||
                  !formData.buyerEmail ||
                  !formData.buyerPhone
                }
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    {t('Submitting...', 'জমা দিচ্ছি...')}
                  </span>
                ) : (
                  messages.submit
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
