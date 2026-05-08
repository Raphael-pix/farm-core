import { cn } from '@/lib/utils'
import type { BreedingStatus } from '@/types/api.types'

const styles: Record<BreedingStatus, { cls: string; label: string }> = {
  PLANNED: {
    cls: 'bg-blue-100 text-blue-800 border border-blue-200',
    label: 'Planned',
  },
  MATED: {
    cls: 'bg-amber-100 text-amber-800 border border-amber-200',
    label: 'Mated',
  },
  PREGNANT: {
    cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    label: 'Confirmed',
  },
  DELIVERED: {
    cls: 'bg-success-soft text-success border border-success/20',
    label: 'Born',
  },
  FAILED: {
    cls: 'bg-red-100 text-red-800 border border-red-200',
    label: 'Failed',
  },
  MISCARRIAGE: {
    cls: 'bg-neutral-soft text-neutral-soft-foreground border border-border',
    label: 'Cancelled',
  },
}

export function BreedingStatusBadge({
  status,
  className,
}: {
  status: BreedingStatus
  className?: string
}) {
  const s = styles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
