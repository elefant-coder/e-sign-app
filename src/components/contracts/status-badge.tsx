import { cn } from '@/lib/utils'
import type { ContractStatus } from '@/types'

interface StatusBadgeProps {
  status: ContractStatus
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  draft: {
    label: '下書き',
    className: 'bg-gray-100 text-gray-600',
  },
  pending: {
    label: '署名待ち',
    className: 'bg-amber-100 text-amber-700',
  },
  completed: {
    label: '完了',
    className: 'bg-emerald-100 text-emerald-700',
  },
  expired: {
    label: '期限切れ',
    className: 'bg-red-100 text-red-700',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
