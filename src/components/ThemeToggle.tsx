'use client'

import { Moon, Settings, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/lib/theme-provider'
import type { Messages } from '@/messages'
import { t } from '@/messages'

type ThemeToggleProps = {
  messages: Messages
}

/**
 * Theme toggle button with dropdown menu.
 * Shows current theme and allows selection between Light, Dark, and System.
 * Production features:
 * - Keyboard accessible (arrow keys, Enter)
 * - Visual indicator of current selection
 * - Smooth icon transition
 * - Mobile-friendly dropdown
 */
export function ThemeToggle({ messages }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const getThemeLabel = (t_theme: string) => {
    switch (t_theme) {
      case 'light':
        return t(messages, 'theme.light')
      case 'dark':
        return t(messages, 'theme.dark')
      case 'system':
        return t(messages, 'theme.system')
      default:
        return t(messages, 'theme.system')
    }
  }

  const ThemeIcon = resolvedTheme === 'dark' ? Sun : Moon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          aria-label={t(messages, 'theme.toggle')}
          title={t(messages, 'theme.toggle')}
        >
          <ThemeIcon className="size-4 transition-transform duration-300" />
          <span className="sr-only">{t(messages, 'theme.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t(messages, 'theme.selectTheme')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={theme === 'light'}
          onCheckedChange={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 size-4" />
          <span>{getThemeLabel('light')}</span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={theme === 'dark'}
          onCheckedChange={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 size-4" />
          <span>{getThemeLabel('dark')}</span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={theme === 'system'}
          onCheckedChange={() => setTheme('system')}
          className="cursor-pointer"
        >
          <span className="mr-2 size-4 flex items-center justify-center text-xs">
            <Settings />
          </span>
          <span>{getThemeLabel('system')}</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
