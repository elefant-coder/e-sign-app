'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignaturePreview } from '@/components/signature/signature-preview'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertCircle, Lightbulb } from 'lucide-react'
import type { SignPageData } from '@/types'
import { OWN_COMPANY_NAME } from '@/lib/config'

const PDFDocument = dynamic(
  () => import('react-pdf').then((mod) => {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
    return mod.Document
  }),
  { ssr: false }
)

const PDFPage = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
)


export default function SignPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<SignPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signatureText, setSignatureText] = useState('')
  const [signing, setSigning] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/sign/${params.token}`)
      const result = await response.json()

      if (!response.ok) {
        if (result.completed) {
          router.push(`/sign/${params.token}/complete`)
          return
        }
        throw new Error(result.error || 'エラーが発生しました')
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [params.token, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSign = async () => {
    if (!signatureText.trim()) {
      toast.error('署名テキストを入力してください')
      return
    }

    setSigning(true)

    try {
      const response = await fetch(`/api/sign/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_text: signatureText }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '署名に失敗しました')
      }

      toast.success('署名が完了しました')
      router.push(`/sign/${params.token}/complete`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSigning(false)
      setConfirmOpen(false)
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

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <span className="text-2xl font-bold text-primary">EleSign</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            {OWN_COMPANY_NAME} より署名のご依頼
          </h1>
          <p className="mt-1 text-muted-foreground">{data.contract.title}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* PDF Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">契約書プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-lg border bg-gray-100" style={{ height: '400px' }}>
                {data.pdfUrl && (
                  <PDFDocument
                    file={data.pdfUrl}
                    onLoadSuccess={({ numPages }: { numPages: number }) => setNumPages(numPages)}
                  >
                    <PDFPage
                      pageNumber={currentPage}
                      width={350}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </PDFDocument>
                )}
              </div>
              {numPages > 1 && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    ◀
                  </Button>
                  <span>
                    {currentPage} / {numPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                  >
                    ▶
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">署名を入力してください</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature">署名テキスト</Label>
                <Input
                  id="signature"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="株式会社　ABC"
                  className="h-14 text-lg"
                />
                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span>全角/半角スペースで改行されます</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">プレビュー:</p>
                <SignaturePreview text={signatureText} variant="client" />
              </div>

              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!signatureText.trim() || signing}
                className="w-full"
                size="lg"
              >
                {signing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    署名中...
                  </>
                ) : (
                  '署名して完了する ✓'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                署名することで、本契約書の内容に同意したものとみなされます
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>この内容で署名しますか？</DialogTitle>
            <DialogDescription>
              署名後は変更できません。内容をご確認ください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2 text-sm font-medium">署名テキスト:</p>
            <SignaturePreview text={signatureText} variant="client" />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={signing}
            >
              キャンセル
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  署名中...
                </>
              ) : (
                '署名する'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
