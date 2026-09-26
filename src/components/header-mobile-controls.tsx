'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, Search, ChevronDown, Check, Sun, Moon, Globe, Settings } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { AppLocale } from '@/lib/locale'
import type { Messages } from '@/messages'
import { t } from '@/messages'
import { useTheme } from '@/lib/theme-provider'
import { useLocale } from '@/components/Providers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// import { ChevronDown, Check } from 'lucide-react'

type MenuItem = {
  label?: string
  href?: string
  children?: Array<{ label?: string; href?: string; description?: string }>
}

type HeaderMobileControlsProps = {
  siteTitle: string
  showSearch: boolean
  searchOpen: boolean
  onSearchToggle: () => void
  menuItems: MenuItem[]
  languages: Array<{ label?: string; code?: string }>
  messages: Messages
  userEmail?: string
  profileAvatar?: string
  fallbackAvatar?: string
}

export function HeaderMobileControls({
  siteTitle,
  showSearch,
  searchOpen,
  onSearchToggle,
  menuItems,
  languages,
  messages,
  userEmail,
  profileAvatar,
  fallbackAvatar,
}: HeaderMobileControlsProps) {
  const { locale: currentLocale, setLocale } = useLocale()
  const isLoggedIn = Boolean(userEmail)
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({})

  const safeMenuItems = menuItems.filter((item) => item?.label && item?.href)

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) => ({ ...prev, [href]: !prev[href] }))
  }

  return (
    <>
      {showSearch ? (
        <Button
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          aria-label={searchOpen ? 'Close search bar' : 'Open search bar'}
          aria-expanded={searchOpen}
          onClick={onSearchToggle}
        >
          <Search />
        </Button>
      ) : null}

      <Sheet>
        <SheetTrigger
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }), 'md:hidden')}
          aria-label="Open menu"
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{siteTitle}</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col px-4 pb-4 overflow-y-auto">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t(messages, 'header.mobileNav')}
            </p>
            <div className="flex flex-col gap-1">
              {safeMenuItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedItems[item.href || '']

                if (hasChildren) {
                  return (
                    <div key={`mobile-menu-${item.href}`}>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" className="justify-start flex-1">
                          <Link href={String(item.href)}>{item.label}</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => toggleExpand(item.href || '')}
                        >
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                          />
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="ml-4 flex flex-col gap-1 border-l-2 border-muted pl-2 mt-1">
                          {item.children!.map((child) => (
                            <SheetClose key={`mobile-submenu-${child.href}`} asChild>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="justify-start text-sm"
                              >
                                <Link href={String(child.href)}>{child.label}</Link>
                              </Button>
                            </SheetClose>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <SheetClose key={`mobile-menu-${item.href}`} asChild>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href={String(item.href)}>{item.label}</Link>
                    </Button>
                  </SheetClose>
                )
              })}
              {!isLoggedIn ? (
                <SheetClose asChild>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/register">{t(messages, 'header.register')}</Link>
                  </Button>
                </SheetClose>
              ) : null}
            </div>

            <div className="mt-auto pt-6">
              <DropdownMenuSeparator className="mb-4" />
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <img
                    src={profileAvatar || fallbackAvatar}
                    alt={userEmail}
                    className="size-9 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{userEmail}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex  gap-4 mt-4">
                <div className="mt-4 p-3 border rounded-lg bg-muted/30 w-1/2">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1.5 px-1">
                    {t(messages, 'header.chooseLanguage')}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-7 px-1.5 text-xs"
                      >
                        <span className="flex items-center gap-1.5 text-xs">
                          <Globe className="size-3.5" />
                          {languages.find(
                            (l) => l.code?.toLowerCase() === currentLocale.toLowerCase(),
                          )?.label || currentLocale}
                        </span>
                        <ChevronDown className="size-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                        {t(messages, 'header.chooseLanguage')}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {languages.map((lng) => {
                        const code = String(lng.code || lng.label || '') as AppLocale
                        const isSelected = code.toLowerCase() === currentLocale.toLowerCase()

                        return (
                          <DropdownMenuItem
                            key={lng.code || lng.label}
                            className="gap-2 text-xs cursor-pointer"
                            onClick={() => {
                              void setLocale(code)
                            }}
                          >
                            <Globe className="size-3.5" />
                            {lng.label}
                            {isSelected && <Check className="size-3 ml-auto" />}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <ThemeSelectorMobile messages={messages} />
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {isLoggedIn ? (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/account">{t(messages, 'header.account')}</Link>
                      </Button>
                    </SheetClose>
                    <form action="/api/auth/logout" method="post">
                      <Button type="submit" variant="destructive" className="w-full justify-start">
                        {t(messages, 'header.logout')}
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild className="w-full justify-start">
                        <Link href="/login">{t(messages, 'header.login')}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/register">{t(messages, 'header.register')}</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/**
 * Theme selector for mobile menu.
 * Displays theme options (Light, Dark, System) with icons.
 * Mobile-optimized version of ThemeToggle component.
 */
function ThemeSelectorMobile({ messages }: { messages: Messages }) {
  const { theme, setTheme } = useTheme()

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

  return (
    <div className="mt-4 p-3 border rounded-lg bg-muted/30 w-1/2">
      <p className="text-[10px] font-medium text-muted-foreground mb-2">
        {t(messages, 'theme.selectTheme')}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between px-2">
            <span className="flex items-center gap-2 text-xs">
              {theme === 'light' && <Sun className="size-4" />}
              {theme === 'dark' && <Moon className="size-4" />}
              {theme === 'system' && (
                <span className="size-4 flex items-center justify-center text-xs">
                  <Settings />
                </span>
              )}
              {getThemeLabel(theme)}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
            {t(messages, 'theme.selectTheme')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2 text-sm cursor-pointer"
            onClick={() => setTheme('light')}
          >
            <Sun className="size-4" />
            {getThemeLabel('light')}
            {theme === 'light' && <Check className="size-3.5 ml-auto" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 text-sm cursor-pointer"
            onClick={() => setTheme('dark')}
          >
            <Moon className="size-4" />
            {getThemeLabel('dark')}
            {theme === 'dark' && <Check className="size-3.5 ml-auto" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 text-sm cursor-pointer"
            onClick={() => setTheme('system')}
          >
            <span className="size-4 flex items-center justify-center text-xs">
              <Settings />
            </span>
            {getThemeLabel('system')}
            {theme === 'system' && <Check className="size-3.5 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
