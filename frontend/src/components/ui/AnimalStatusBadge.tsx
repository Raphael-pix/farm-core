import { cn } from '@/lib/utils'
import type { AnimalStatus } from '@/types/api.types'

const styles: Record<AnimalStatus, { cls: string; label: string }> = {
  ACTIVE: {
    cls: 'bg-success-soft text-success border border-success/20',
    label: 'Active',
  },
  SOLD: {
    cls: 'bg-blue-100 text-blue-800 border border-blue-200',
    label: 'Sold',
  },
  DEAD: {
    cls: 'bg-neutral-soft text-neutral-soft-foreground border border-border',
    label: 'Dead',
  },
  MISSING: {
    cls: 'bg-warning-soft text-warning-foreground border border-warning/30',
    label: 'Missing',
  },
  ARCHIVED: {
    cls: 'bg-muted text-muted-foreground border border-border',
    label: 'Archived',
  },
}

export function AnimalStatusBadge({
  status,
  className,
}: {
  status: AnimalStatus
  className?: string
}) {
  const s = styles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        s.cls,
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'ACTIVE' && 'bg-success',
          status === 'SOLD' && 'bg-blue-600',
          status === 'DEAD' && 'bg-neutral-soft-foreground',
          status === 'MISSING' && 'bg-warning',
          status === 'ARCHIVED' && 'bg-muted-foreground',
        )}
      />
      {s.label}
    </span>
  )
}
