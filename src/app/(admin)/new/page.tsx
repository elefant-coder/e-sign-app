'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileDropzone } from '@/components/file-dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNewContract } from '@/contexts/new-contract-context'
import { ArrowRight } from 'lucide-react'

export default function NewContractStep1Page() {
  const router = useRouter()
  const {
    state,
    setFile,
    setFileUrl,
    setPdfPath,
    setTitle,
    canProceedToStep2,
  } = useNewContract()

  const handleFileSelect = (file: File) => {
    setFile(file)
    setFileUrl(URL.createObjectURL(file))
    // Extract title from filename (remove extension)
    if (!state.title) {
      const title = file.name.replace(/\.pdf$/i, '')
      setTitle(title)
    }
  }

  const handleUploadComplete = (path: string) => {
    setPdfPath(path)
  }

  const handleRemove = () => {
    setFile(null)
    setFileUrl(null)
    setPdfPath(null)
  }

  const handleNext = () => {
    if (canProceedToStep2) {
      router.push('/new/recipient')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">文書をアップロード</h1>
        <p className="mt-1 text-muted-foreground">
          署名を依頼する契約書をアップロードしてください
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PDFファイル</CardTitle>
          <CardDescription>
            契約書のPDFファイルをドラッグ&ドロップまたは選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileDropzone
            onFileSelect={handleFileSelect}
            onUploadComplete={handleUploadComplete}
            selectedFile={state.file}
            onRemove={handleRemove}
          />
        </CardContent>
      </Card>

      {state.pdfPath && (
        <Card>
          <CardHeader>
            <CardTitle>契約書タイトル</CardTitle>
            <CardDescription>
              契約一覧に表示されるタイトルを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={state.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：業務委託契約書"
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!canProceedToStep2}
          size="lg"
        >
          次へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
