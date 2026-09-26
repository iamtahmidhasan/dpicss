'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { HeaderMobileControls } from '@/components/header-mobile-controls'
import { LanguageSelector } from '@/components/LanguageSelector'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Messages } from '@/messages'
import { t } from '@/messages'
import { useLocale } from '@/components/Providers'

type MenuItem = {
  label?: string
  href?: string
  children?: Array<{ label?: string; href?: string; description?: string }>
}

type BannerData = {
  text: string
  link?: string
  backgroundColor: string
  textColor: string
}

type HeaderClientProps = {
  siteTitle: string
  siteTagline?: string
  logoURL: string
  menuItems: MenuItem[]
  languages: Array<{ label?: string; code?: string }>
  messages: Messages
  showSearch: boolean
  user: { email: string; memberCategory?: string } | null
  profileAvatar: string
  fallbackAvatar: string
  selectedLanguageLabel?: string
  banner?: BannerData | null
}

/**
 * Client-side header component with interactive elements.
 * Handles theme toggle, language selection, and user dropdown.
 * Production-ready: Separated from server logic for proper context access.
 */
export function HeaderClient({
  siteTitle,
  siteTagline,
  logoURL,
  menuItems,
  languages,
  messages,
  showSearch,
  user,
  profileAvatar,
  fallbackAvatar,
  selectedLanguageLabel,
  banner,
}: HeaderClientProps) {
  const { locale } = useLocale()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
  }, [searchOpen])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()

    if (!query) return

    setSearchOpen(false)
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const toggleSearchBar = () => {
    setSearchOpen((open) => !open)
  }

  return (
    <>
      {banner && banner.text && (
        <div
          className={cn(
            'w-full py-2 text-center text-sm font-medium hidden',
            banner.backgroundColor,
            banner.textColor,
          )}
        >
          {banner.link ? (
            <Link href={banner.link} className="hover:underline hidden">
              {banner.text}
            </Link>
          ) : (
            banner.text
          )}
        </div>
      )}
      <header className="sticky top-0 z-41 border-b bg-white dark:bg-black">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoURL ? (
              <img src='https://dpicss.vercel.app/dpicslogo.png' alt={siteTitle} className="size-8 rounded-md object-cover" />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                CS
              </div>
            )}
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{siteTitle}</span>
              {siteTagline ? (
                <span className="text-[7px] text-muted-foreground">{siteTagline}</span>
              ) : null}
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {menuItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0

                  if (hasChildren) {
                    return (
                      <NavigationMenuItem key={item.href}>
                        <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="w-[300px] space-y-2 p-3">
                            {item.children!.map((child) => (
                              <li key={child.href}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={String(child.href)}
                                    className="block flex flex-col items-start select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">
                                      {child.label}
                                    </div>
                                    {child.description && (
                                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                        {child.description}
                                      </p>
                                    )}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    )
                  }

                  return (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href={String(item.href)}>{item.label}</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {showSearch && (
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden md:inline-flex"
                aria-label={searchOpen ? 'Close search bar' : 'Open search bar'}
                aria-expanded={searchOpen}
                onClick={toggleSearchBar}
              >
                <Search />
              </Button>
            )}

            <div className="hidden sm:block">
              <LanguageSelector
                languages={languages}
                selectedLanguageLabel={selectedLanguageLabel}
                messages={messages}
              />
            </div>

            <div className="hidden sm:block">
              <ThemeToggle messages={messages} />
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                    'size-9 rounded-full overflow-hidden p-0 border',
                  )}
                  aria-label="User menu"
                >
                  <img
                    src={profileAvatar || fallbackAvatar}
                    alt={user.email}
                    className="size-full rounded-full object-cover"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">{t(messages, 'header.account')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <form action="/api/auth/logout" method="post" className="w-full">
                      <button type="submit" className="w-full text-left">
                        {t(messages, 'header.logout')}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">{t(messages, 'header.login')}</Link>
              </Button>
            )}

            <HeaderMobileControls
              siteTitle={siteTitle}
              showSearch={showSearch}
              searchOpen={searchOpen}
              onSearchToggle={toggleSearchBar}
              menuItems={menuItems}
              languages={languages}
              messages={messages}
              userEmail={user?.email}
              profileAvatar={profileAvatar}
              fallbackAvatar={fallbackAvatar}
            />
          </div>
        </div>

        {showSearch && searchOpen ? (
          <div className="border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
            <form onSubmit={handleSearchSubmit} className="mx-auto w-full max-w-7xl">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search courses, posts, members..."
                  aria-label="Search site"
                  className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </form>
          </div>
        ) : null}
      </header>
    </>
  )
}
