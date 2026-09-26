'use client'

import { Check, Globe } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { t } from '@/messages'
import type { Messages } from '@/messages'
import type { AppLocale } from '@/lib/locale'
import { useLocale } from '@/components/Providers'

type LanguageSelectorProps = {
  languages: Array<{ label?: string; code?: string }>
  selectedLanguageLabel?: string
  messages: Messages
}

export function LanguageSelector({
  languages,
  selectedLanguageLabel,
  messages,
}: LanguageSelectorProps) {
  const { locale: currentLocale, setLocale } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" className="rounded-md">
          <Globe className="size-4" />
          <span className="sr-only">{t(messages, 'header.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t(messages, 'header.chooseLanguage')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lng) => {
          const code = String(lng.code || lng.label || '') as AppLocale
          const isSelected = code.toLowerCase() === currentLocale.toLowerCase()

          return (
            <DropdownMenuCheckboxItem
              key={lng.code || lng.label}
              checked={isSelected}
              onCheckedChange={() => setLocale(code)}
              className="cursor-pointer"
            >
              <span>{lng.label}</span>
              {isSelected ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3.5" />
                </span>
              ) : null}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
