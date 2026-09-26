import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Search, Undo2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl items-center justify-center">
        <Card className="w-full border-border/70 bg-card/95 shadow-xl backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <Badge variant="secondary" className="mx-auto w-fit px-3 py-1 text-xs tracking-wide">
              Error 404
            </Badge>
            <CardTitle className="text-5xl font-black tracking-tight sm:text-7xl">
              Page Not Found
            </CardTitle>
            <CardDescription className="mx-auto max-w-xl text-sm sm:text-base">
              The page you tried to open does not exist or may have been moved. Try returning home
              or searching for what you need.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="mx-auto grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back To Home
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/search">
                  <Search className="mr-2 h-4 w-4" />
                  Search Site
                </Link>
              </Button>
            </div>

            <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Still stuck? Go back to the previous page and try a different link.
              </p>
              <div className="mt-3">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">
                    <Undo2 className="mr-2 h-4 w-4" />
                    Return Safely
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
