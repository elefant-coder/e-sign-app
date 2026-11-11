'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle, AlertCircle, Download, Check } from 'lucide-react'
import type { Contract } from '@/types'
import { OWN_COMPANY_NAME } from '@/lib/config'


export default function SignCompletePage() {
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/sign/${params.token}`)

      // We expect this to fail with "completed" since the contract is signed
      // But we can still get the data from a GET request
      if (response.ok) {
        const data = await response.json()
        setContract(data.contract as unknown as Contract)
      } else {
        const result = await response.json()
        if (result.error === 'この契約は既に署名済みです') {
          // This is expected, fetch the contract data another way
          // For now, we'll just show a basic completion message
          setContract(null)
        } else {
          throw new Error(result.error || 'エラーが発生しました')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [params.token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDownload = async () => {
    setDownloading(true)

    try {
      // Create a download API that accepts token
      const response = await fetch(`/api/sign/${params.token}/download`)

      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'signed-contract.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-lg font-semibold">エラー</h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <span className="text-2xl font-bold text-primary">EleSign</span>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center">
              {/* Success Icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>

              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                署名が完了しました
              </h1>
              <p className="mt-2 text-muted-foreground">
                署名済みの契約書をメールでお送りしました
              </p>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="mt-6"
                size="lg"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                PDFをダウンロード
              </Button>
            </div>

            <Separator className="my-8" />

            {/* Contract Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                {contract?.title || '契約書'}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{OWN_COMPANY_NAME}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {contract?.client_company} {contract?.client_name}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
