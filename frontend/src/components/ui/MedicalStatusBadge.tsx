import { cn } from '@/lib/utils'
import type { MedicalRecordStatus } from '@/types/api.types'

const styles: Record<MedicalRecordStatus, { cls: string; label: string }> = {
  COMPLETED: {
    cls: 'bg-success-soft text-success border border-success/20',
    label: 'Completed',
  },
  SCHEDULED: {
    cls: 'bg-blue-100 text-blue-800 border border-blue-200',
    label: 'Scheduled',
  },
  MISSED: {
    cls: 'bg-red-100 text-red-800 border border-red-200',
    label: 'Missed',
  },
  CANCELLED: {
    cls: 'bg-neutral-soft text-neutral-soft-foreground border border-border',
    label: 'Cancelled',
  },
}

export function MedicalStatusBadge({
  status,
  className,
}: {
  status: MedicalRecordStatus
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
