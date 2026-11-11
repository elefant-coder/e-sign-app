'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SignatureInput } from '@/components/signature/signature-input'
import { useNewContract } from '@/contexts/new-contract-context'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function NewContractStep2Page() {
  const router = useRouter()
  const {
    state,
    setClient,
    setOwnSignatureText,
    canProceedToStep2,
    canProceedToStep3,
  } = useNewContract()

  // Redirect to step 1 if no PDF is uploaded
  useEffect(() => {
    if (!canProceedToStep2) {
      router.push('/new')
    }
  }, [canProceedToStep2, router])

  const handleClientChange = (field: keyof typeof state.client, value: string) => {
    setClient({ ...state.client, [field]: value })
  }

  const handleNext = () => {
    if (canProceedToStep3) {
      router.push('/new/positions')
    }
  }

  const handleBack = () => {
    router.push('/new')
  }

  if (!canProceedToStep2) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">送信先の設定</h1>
        <p className="mt-1 text-muted-foreground">
          署名を依頼する相手の情報を入力してください
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>クライアント情報</CardTitle>
          <CardDescription>署名を依頼する相手の情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">会社名 *</Label>
            <Input
              id="company"
              value={state.client.company}
              onChange={(e) => handleClientChange('company', e.target.value)}
              placeholder="例：株式会社ABC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">担当者名 *</Label>
            <Input
              id="name"
              value={state.client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              placeholder="例：山田 太郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              value={state.client.email}
              onChange={(e) => handleClientChange('email', e.target.value)}
              placeholder="例：yamada@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自社情報（署名に使用）</CardTitle>
          <CardDescription>PDFに埋め込む自社署名のテキストを入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureInput
            label="署名テキスト *"
            value={state.ownSignatureText}
            onChange={setOwnSignatureText}
            placeholder="例：株式会社〇〇"
            variant="own"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={handleNext} disabled={!canProceedToStep3} size="lg">
          次へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
