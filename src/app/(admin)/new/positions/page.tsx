'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { PDFViewer } from '@/components/pdf/pdf-viewer'
import { useNewContract } from '@/contexts/new-contract-context'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { SignaturePosition } from '@/types'

export default function NewContractStep3Page() {
  const router = useRouter()
  const {
    state,
    setOwnPosition,
    setClientPosition,
    canProceedToStep3,
    canProceedToStep4,
  } = useNewContract()

  // Redirect to step 2 if prerequisites are not met
  useEffect(() => {
    if (!canProceedToStep3) {
      router.push('/new/recipient')
    }
  }, [canProceedToStep3, router])

  const signatureBoxes = useMemo(
    () => [
      { id: 'own' as const, label: '自社署名', position: state.positions.own },
      { id: 'client' as const, label: 'クライアント署名', position: state.positions.client },
    ],
    [state.positions]
  )

  const handlePositionChange = (id: 'own' | 'client', position: SignaturePosition) => {
    if (id === 'own') {
      setOwnPosition(position)
    } else {
      setClientPosition(position)
    }
  }

  const handleNext = () => {
    if (canProceedToStep4) {
      router.push('/new/confirm')
    }
  }

  const handleBack = () => {
    router.push('/new/recipient')
  }

  if (!canProceedToStep3 || !state.fileUrl) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">署名位置の設定</h1>
        <p className="mt-1 text-muted-foreground">
          左の署名欄をPDF上にドラッグして配置してください
        </p>
      </div>

      <PDFViewer
        url={state.fileUrl}
        signatureBoxes={signatureBoxes}
        onPositionChange={handlePositionChange}
      />

      {!canProceedToStep4 && (
        <p className="text-center text-sm text-amber-600">
          両方の署名欄を配置してください
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={handleNext} disabled={!canProceedToStep4} size="lg">
          次へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
