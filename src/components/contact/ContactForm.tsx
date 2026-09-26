'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ContactFormProps = {
  messages: {
    name: string
    namePlaceholder: string
    email: string
    emailPlaceholder: string
    phone: string
    phonePlaceholder: string
    subject: string
    subjectPlaceholder: string
    message: string
    messagePlaceholder: string
    submit: string
    sending: string
    success: string
    successMessage: string
    error: string
    errorMessage: string
  }
}

export function ContactForm({ messages }: ContactFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || messages.errorMessage)
        }

        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        })

        setTimeout(() => setSuccess(false), 5000)
      } catch (err) {
        setError(err instanceof Error ? err.message : messages.errorMessage)
      }
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-6 text-xl font-semibold">{messages.submit}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{messages.name} *</Label>
              <Input
                id="name"
                name="name"
                placeholder={messages.namePlaceholder}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{messages.email} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={messages.emailPlaceholder}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{messages.phone}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder={messages.phonePlaceholder}
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{messages.subject} *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder={messages.subjectPlaceholder}
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{messages.message} *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder={messages.messagePlaceholder}
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="size-4" />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="size-4" />
                {messages.successMessage}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {messages.sending}
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                {messages.submit}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
