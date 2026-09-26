'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Category = {
  id: string
  name?: unknown
}

function pickLocalized(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, string>
    return o.en || o.bn || ''
  }
  return ''
}

type TeamFiltersProps = {
  categories: Category[]
  initialCategory?: string
}

export function TeamFilters({ categories, initialCategory }: TeamFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateFilter = useCallback(
    (key: string, value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
        params.delete('page')
        router.push(`/teams?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      if (debounceTimer) clearTimeout(debounceTimer)
      const timer = setTimeout(() => {
        updateFilter('search', value)
      }, 300)
      setDebounceTimer(timer)
    },
    [debounceTimer, updateFilter],
  )

  const clearFilters = () => {
    setSearch('')
    startTransition(() => {
      router.push('/teams', { scroll: false })
    })
  }

  const hasFilters = searchParams.get('search') || searchParams.get('category')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={searchParams.get('category') || initialCategory || 'all'}
          onValueChange={(value: string) => updateFilter('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {pickLocalized(cat.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchParams.get('search') && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchParams.get('search')}
              <button
                onClick={() => updateFilter('search', '')}
                className="ml-1 rounded-sm hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {searchParams.get('category') && (
            <Badge variant="secondary" className="gap-1">
              Category:{' '}
              {pickLocalized(
                categories.find((c) => c.id === searchParams.get('category'))?.name
              ) || searchParams.get('category')}
              <button
                onClick={() => updateFilter('category', '')}
                className="ml-1 rounded-sm hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear all
          </Button>
        </div>
      )}

      {isPending && <div className="h-0.5 bg-primary/20 animate-pulse" />}
    </div>
  )
}
