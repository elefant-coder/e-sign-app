'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileDropzone } from '@/components/file-dropzone'
import { ContractList } from '@/components/contracts/contract-list'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Contract, ContractStatus } from '@/types'
import { useNewContract } from '@/contexts/new-contract-context'

export default function DashboardPage() {
  const router = useRouter()
  const { setFile, setFileUrl, setPdfPath, setTitle, reset } = useNewContract()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ContractStatus | 'all'>('all')

  const fetchContracts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('status', filter)
      }
      const response = await fetch(`/api/contracts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const handleFileSelect = (file: File) => {
    reset()
    setFile(file)
    setFileUrl(URL.createObjectURL(file))
    // Extract title from filename (remove extension)
    const title = file.name.replace(/\.pdf$/i, '')
    setTitle(title)
  }

  const handleUploadComplete = (path: string) => {
    setPdfPath(path)
    router.push('/new')
  }

  const filteredContracts = contracts.filter((contract) => {
    if (filter === 'all') return true
    return contract.status === filter
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* File Drop Zone */}
      <div className="mb-8">
        <FileDropzone
          onFileSelect={handleFileSelect}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Separator */}
      <div className="mb-8 border-t" />

      {/* Contract List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">契約一覧</h2>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as ContractStatus | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="フィルター" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="draft">下書き</SelectItem>
              <SelectItem value="pending">署名待ち</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="expired">期限切れ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <ContractList contracts={filteredContracts} />
        )}
      </div>
    </div>
  )
}
