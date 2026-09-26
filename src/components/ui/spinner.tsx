import { LoaderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Main spinner (same name you already use)
function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

// Wrapper (optional usage)
function SpinnerCustom() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  )
}

// ✅ export both
export { Spinner, SpinnerCustom }
