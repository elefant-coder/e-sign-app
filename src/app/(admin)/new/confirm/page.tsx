'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignaturePreview } from '@/components/signature/signature-preview'
import { useNewContract } from '@/contexts/new-contract-context'
import { ArrowLeft, Send, FileText, Mail, Pen, Loader2 } from 'lucide-react'

export default function NewContractStep4Page() {
  const router = useRouter()
  const { state, canProceedToStep4, reset } = useNewContract()
  const [loading, setLoading] = useState(false)

  // Redirect to step 3 if prerequisites are not met
  useEffect(() => {
    if (!canProceedToStep4) {
      router.push('/new/positions')
    }
  }, [canProceedToStep4, router])

  const handleBack = () => {
    router.push('/new/positions')
  }

  const handleSubmit = async () => {
    if (!canProceedToStep4 || !state.positions.own || !state.positions.client) {
      return
    }

    setLoading(true)

    try {
      // Create the contract
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.title,
          pdf_path: state.pdfPath,
          client_company: state.client.company,
          client_name: state.client.name,
          client_email: state.client.email,
          own_signature_text: state.ownSignatureText,
          own_signature_position: state.positions.own,
          client_signature_position: state.positions.client,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '契約の作成に失敗しました')
      }

      const contract = await response.json()

      // Send the contract
      const sendResponse = await fetch(`/api/contracts/${contract.id}/send`, {
        method: 'POST',
      })

      if (!sendResponse.ok) {
        const data = await sendResponse.json()
        throw new Error(data.error || '送信に失敗しました')
      }

      toast.success('署名依頼を送信しました')
      reset()
      router.push(`/contracts/${contract.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!canProceedToStep4) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">内容を確認して送信</h1>
        <p className="mt-1 text-muted-foreground">
          入力内容を確認し、問題なければ送信してください
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">契約書情報</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/new')}
          >
            編集
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex">
            <span className="w-24 text-muted-foreground">タイトル:</span>
            <span className="font-medium">{state.title}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-muted-foreground">ファイル:</span>
            <span className="font-medium">{state.file?.name || 'アップロード済み'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">送信先</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/new/recipient')}
          >
            編集
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex">
            <span className="w-24 text-muted-foreground">会社名:</span>
            <span className="font-medium">{state.client.company}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-muted-foreground">担当者:</span>
            <span className="font-medium">{state.client.name} 様</span>
          </div>
          <div className="flex">
            <span className="w-24 text-muted-foreground">メール:</span>
            <span className="font-medium">{state.client.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Pen className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">署名プレビュー</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/new/recipient')}
          >
            編集
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">自社署名:</p>
              <SignaturePreview text={state.ownSignatureText} variant="own" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">クライアント署名:</p>
              <div className="flex min-h-[60px] items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-3 text-sm text-blue-400">
                （署名待ち）
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} size="lg" disabled={loading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={handleSubmit} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              署名して送信
              <Send className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
