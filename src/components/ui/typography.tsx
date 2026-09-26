import * as React from 'react'
import { cn } from '@/lib/utils'

function cnMerge(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

const Prose = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cnMerge(
        'prose prose-neutral dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-headings:text-foreground',
        'prose-h1:text-3xl prose-h1:font-bold',
        'prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4',
        'prose-h3:text-xl prose-h3:font-semibold',
        'prose-p:text-muted-foreground prose-p:leading-relaxed',
        'prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:no-underline',
        'prose-strong:text-foreground',
        'prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4',
        'prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground',
        'prose-ul:list-disc prose-ul:pl-6',
        'prose-ol:list-decimal prose-ol:pl-6',
        'prose-li:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
Prose.displayName = 'Prose'

export { Prose }
