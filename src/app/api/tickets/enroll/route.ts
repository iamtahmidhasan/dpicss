import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, buyerName, buyerEmail, buyerPhone, paymentMethod, transactionId, senderNumber, notes } = body

    // Validate required fields
    if (!eventId || !buyerName || !buyerEmail || !buyerPhone || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Get current authenticated user
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = user.id as string

    // Fetch event details
    const event = await payload.findByID({
      collection: 'events' as any,
      id: eventId,
      depth: 0,
      overrideAccess: true,
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Validate event status
    if (event.status === 'cancelled' || event.status === 'completed') {
      return NextResponse.json(
        { error: 'This event is not available for booking' },
        { status: 400 },
      )
    }

    // Check seat availability
    const availableSeats = Math.max(0, (event.totalSeats || 0) - (event.soldSeats || 0))
    if (availableSeats < 1) {
      return NextResponse.json({ error: 'Event is sold out' }, { status: 400 })
    }

    // Check if user already has a ticket for this event
    const existingTicket = await payload.find({
      collection: 'ticket-enrollments' as any,
      where: {
        and: [
          { user: { equals: userId } },
          { event: { equals: eventId } },
          { status: { in: ['pending', 'confirmed'] } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existingTicket.docs.length > 0) {
      const existingStatus = existingTicket.docs[0].status as string
      return NextResponse.json(
        {
          error: `You already have a ${existingStatus} ticket for this event. One ticket per user per event.`,
        },
        { status: 409 },
      )
    }

    // Validate payment method requirements
    const isHandToHand = paymentMethod === 'hand_to_hand'
    if (!isHandToHand) {
      if (!transactionId) {
        return NextResponse.json(
          { error: 'Transaction ID is required for this payment method' },
          { status: 400 },
        )
      }
      if (!senderNumber) {
        return NextResponse.json(
          { error: 'Sender number is required for online payments' },
          { status: 400 },
        )
      }
    }

    // Fetch PaymentSettings for validation against global settings
    const paymentSettings = await (
      payload as unknown as {
        findGlobal: (args: { slug: string; depth?: number }) => Promise<PaymentSettings>
      }
    ).findGlobal({
      slug: 'paymentSettings',
      depth: 0,
    })

    const settings = paymentSettings || {}

    // Validate that payment method is enabled globally
    const methodEnabled = (() => {
      switch (paymentMethod) {
        case 'bkash':
          return settings.bkash?.enabled && settings.bkash?.number
        case 'nagad':
          return settings.nagad?.enabled && settings.nagad?.number
        case 'rocket':
          return settings.rocket?.enabled && settings.rocket?.number
        case 'hand_to_hand':
          return settings.cash?.enabled
        case 'bank':
          return settings.bank?.enabled
        default:
          return false
      }
    })()

    if (!methodEnabled) {
      return NextResponse.json(
        { error: 'This payment method is currently unavailable' },
        { status: 400 },
      )
    }

    // Calculate total amount (1 ticket per user)
    const totalAmount = event.ticketPrice || 0

    // Create ticket enrollment
    const enrollment = await payload.create({
      collection: 'ticket-enrollments' as any,
      data: {
        event: eventId,
        user: userId,
        buyerName,
        buyerEmail,
        buyerPhone,
        quantity: 1, // Fixed to 1
        paymentMethod,
        transactionId: isHandToHand ? undefined : transactionId,
        senderNumber: isHandToHand ? undefined : senderNumber,
        notes: notes || '',
        totalAmount,
        status: 'pending',
      },
      overrideAccess: true,
      req: { user } as any,
    })

    return NextResponse.json({
      success: true,
      id: enrollment.id,
      totalAmount,
      message:
        'Ticket enrollment created successfully. Admin will verify payment and confirm your ticket.',
    })
  } catch (error) {
    console.error('[Ticket Enrollment] Error:', error)

    // Provide meaningful error for duplicate key (user + event)
    if (
      error instanceof Error &&
      error.message.includes('E11000') &&
      error.message.includes('user_event')
    ) {
      return NextResponse.json(
        { error: 'You already have a ticket for this event' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process ticket enrollment',
      },
      { status: 500 },
    )
  }
}
