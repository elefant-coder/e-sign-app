'use client'

import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { Contract } from '@/types'

interface ContractListProps {
  contracts: Contract[]
}

export function ContractList({ contracts }: ContractListProps) {
  const router = useRouter()

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm text-muted-foreground">
          契約書がありません
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border bg-white">
      {contracts.map((contract) => (
        <div
          key={contract.id}
          onClick={() => router.push(`/contracts/${contract.id}`)}
          className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{contract.title}</h3>
              <p className="text-sm text-muted-foreground">
                {contract.client_company} {contract.client_name}様
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <StatusBadge status={contract.status} />
            <span className="text-sm text-muted-foreground">
              {new Date(contract.created_at).toLocaleDateString('ja-JP', {
                month: 'numeric',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
