import type { CollectionConfig } from 'payload'
import { adminOnly } from '../access'
import { trackActivity } from '../hooks/trackActivity'

export const TicketEnrollments: CollectionConfig = {
  slug: 'ticket-enrollments' as any,
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['event', 'user', 'status', 'paymentMethod', 'createdAt'],
    group: 'Learning Management',
  },
  // Database indexes for performance and uniqueness
  indexes: [
    { fields: ['event'] },
    { fields: ['user'] },
    { fields: ['status'] },
    { fields: ['user', 'event'], unique: true }, // One ticket per user per event
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      if (user?.roles?.includes('editor')) return true
      if (user?.roles?.includes('instructor')) return true
      return { user: { equals: user?.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      if (user?.roles?.includes('editor')) return true
      if (user?.roles?.includes('instructor')) return true
      return { user: { equals: user?.id } }
    },
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          if (!req.user?.id) {
            throw new Error('You must be logged in to enroll')
          }
          data.user = req.user.id

          // Force quantity to 1 (no bulk ticket purchases)
          data.quantity = 1

          // Check for existing enrollment for this user + event combo
          const existingEnrollment = await req.payload.find({
            collection: 'ticket-enrollments' as any,
            where: {
              and: [
                { user: { equals: req.user.id } },
                { event: { equals: data.event } },
                { status: { in: ['pending', 'confirmed'] } },
              ],
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          if (existingEnrollment.docs.length > 0) {
            const existingStatus = existingEnrollment.docs[0].status as string
            throw new Error(
              `You already have a ${existingStatus} ticket enrollment for this event. One ticket per user per event.`,
            )
          }

          // Fetch event to get ticket price and validate payment method
          const event = await req.payload.findByID({
            collection: 'events' as any,
            id: String(data.event),
            depth: 0,
            overrideAccess: true,
          })

          if (!event) {
            throw new Error('Event not found')
          }

          // Calculate total amount based on quantity (1) and ticket price
          data.totalAmount = (event.ticketPrice || 0) * 1
        }

        // Auto-calculate totalAmount on updates for quantity/price changes
        if (operation === 'update' && data.quantity) {
          const event = await req.payload.findByID({
            collection: 'events' as any,
            id: String(data.event),
            depth: 0,
            overrideAccess: true,
          })
          if (event) {
            data.totalAmount = (event.ticketPrice || 0) * (data.quantity || 1)
          }
        }

        return data
      },
    ],
    afterChange: [
      trackActivity,
      async ({ doc, operation, req }) => {
        const eventId = typeof doc.event === 'object' ? doc.event.id : doc.event
        if (operation === 'create' && eventId && doc.quantity) {
          try {
            const event = await req.payload.findByID({
              collection: 'events' as any,
              id: eventId,
              depth: 0,
            })
            if (event) {
              await req.payload.update({
                collection: 'events' as any,
                id: eventId,
                data: {
                  soldSeats: (event.soldSeats || 0) + doc.quantity,
                },
              })
            }
          } catch (err) {
            req.payload.logger.error(`Failed to update event sold seats: ${err}`)
          }
        }
        if (operation === 'update' && doc.status === 'cancelled' && eventId && doc.quantity) {
          try {
            const event = await req.payload.findByID({
              collection: 'events' as any,
              id: eventId,
              depth: 0,
            })
            if (event) {
              await req.payload.update({
                collection: 'events' as any,
                id: eventId,
                data: {
                  soldSeats: Math.max(0, (event.soldSeats || 0) - doc.quantity),
                },
              })
            }
          } catch (err) {
            req.payload.logger.error(`Failed to update event sold seats on cancel: ${err}`)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events' as any,
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 1,
      min: 1,
      max: 1, // Fixed to 1 - one ticket per user per event
      admin: {
        readOnly: true,
        description: 'Always 1 ticket per user per event',
      },
    },
    {
      name: 'buyerName',
      type: 'text',
      required: true,
    },
    {
      name: 'buyerEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'buyerPhone',
      type: 'text',
      required: true,
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      options: [
        { label: 'bKash', value: 'bKash' },
        { label: 'Nagad', value: 'Nagad' },
        { label: 'Rocket', value: 'Rocket' },
        { label: 'Hand to Hand Cash', value: 'hand_to_hand' },
        { label: 'Bank Transfer', value: 'bank' },
      ],
    },
    {
      name: 'transactionId',
      type: 'text',
      admin: {
        description:
          'Required for online payments (bKash, Nagad, Rocket). Leave empty for cash payments.',
      },
    },
    {
      name: 'senderNumber',
      type: 'text',
      admin: {
        description:
          'Sender mobile banking number used for payment',
      },
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
