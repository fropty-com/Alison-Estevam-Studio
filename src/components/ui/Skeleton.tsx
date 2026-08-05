import { cn } from '@/lib/utils'

/** A single pulsing placeholder block — the building block for loading skeletons across the app. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-offwhite/10 animate-pulse', className)} aria-hidden="true" />
}
