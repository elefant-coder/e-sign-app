'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/contracts/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Download,
  Trash2,
  RefreshCw,
  Mail,
  Check,
  Circle,
  Loader2,
} from 'lucide-react'
import type { Contract } from '@/types'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fetchContract = useCallback(async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`)
      if (!response.ok) {
        throw new Error('契約が見つかりません')
      }
      const data = await response.json()
      setContract(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const handleResend = async () => {
    if (!contract) return
    setResending(true)

    try {
      const response = await fetch(`/api/contracts/${contract.id}/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '再送信に失敗しました')
      }

      toast.success('署名依頼を再送信しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setResending(false)
    }
  }

  const handleDelete = async () => {
    if (!contract) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      toast.success('契約を削除しました')
      router.push('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleDownload = async () => {
    if (!contract) return

    try {
      const pdfPath = contract.signed_pdf_path || contract.pdf_path
      const response = await fetch(`/api/contracts/${contract.id}/download`)

      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${contract.title}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ダウンロードに失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!contract) {
    return null
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        一覧に戻る
      </Button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            作成日: {formatDate(contract.created_at)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              送信先
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  {contract.client_company} {contract.client_name} 様
                </p>
                <p className="text-sm text-muted-foreground">{contract.client_email}</p>
              </div>
              {contract.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  再送信
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>署名状況</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {contract.own_signed_at ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
              <div>
                <p className="font-medium">自社署名</p>
                <p className="text-sm text-muted-foreground">
                  {contract.own_signed_at ? formatDate(contract.own_signed_at) : '署名待ち'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {contract.client_signed_at ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
              <div>
                <p className="font-medium">クライアント署名</p>
                <p className="text-sm text-muted-foreground">
                  {contract.client_signed_at ? formatDate(contract.client_signed_at) : '署名待ち'}
                </p>
              </div>
            </div>
            {contract.expires_at && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  署名期限: {formatDate(contract.expires_at)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            PDFをダウンロード
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>契約を削除しますか？</DialogTitle>
                <DialogDescription>
                  この操作は取り消せません。契約書のPDFファイルも削除されます。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  削除する
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
