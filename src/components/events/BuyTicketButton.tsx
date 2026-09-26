'use client'

import { BuyTicketDialog } from '@/components/events/BuyTicketDialog'
import { Button } from '@/components/ui/button'
import { Ticket } from 'lucide-react'
import { useRouter } from 'next/navigation'

type EventData = {
  id: string
  name?: unknown
  ticketPrice?: number
  ticketCurrency?: string
  paymentMethods?: { method: string; accountNumber?: string }[]
  totalSeats?: number
  soldSeats?: number
}

type Messages = {
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
  quantity: string
  paymentMethod: string
  selectPaymentMethod: string
  transactionId: string
  transactionIdPlaceholder: string
  transactionIdHelp: string
  total: string
  handToHandNote: string
  success: string
  successMessage: string
  error: string
  errorMessage: string
  soldOut: string
  notAvailable: string
}

type Props = {
  event: EventData
  isRegistered: boolean
  registrationStatus: string | null
  isSoldOut: boolean
  isLoggedIn: boolean
  messages: Messages
}

export function BuyTicketButton({ event, isRegistered, registrationStatus, isSoldOut, isLoggedIn, messages }: Props) {
  const router = useRouter()

  if (!isLoggedIn) {
    return (
      <Button
        size="lg"
        className="w-full"
        onClick={() => router.push('/login')}
      >
        <Ticket className="mr-2 size-5" />
        {messages.loginRequired}
      </Button>
    )
  }

  if (isRegistered) {
    return (
      <>
        <Button size="lg" className="w-full" disabled variant="secondary">
          <Ticket className="mr-2 size-5" />
          Already Registered
        </Button>
        <p className="text-center text-xs text-success font-medium">
          {registrationStatus === 'pending' ? 'Registration pending approval' : 'You are registered for this event'}
        </p>
      </>
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
    <BuyTicketDialog
      event={event}
      isLoggedIn={true}
      userEmail=""
      userName=""
      messages={messages}
    />
  )
}