'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase/client'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  onUploadComplete?: (path: string) => void
  selectedFile?: File | null
  onRemove?: () => void
  maxSize?: number // in bytes
  accept?: Record<string, string[]>
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function FileDropzone({
  onFileSelect,
  onUploadComplete,
  selectedFile,
  onRemove,
  maxSize = MAX_FILE_SIZE,
  accept = { 'application/pdf': ['.pdf'] },
  className,
}: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      setUploadProgress(0)
      setError(null)

      try {
        // Step 1: Get signed upload URL from API (small request, no 413)
        const response = await fetch('/api/upload', {
          method: 'POST',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'アップロードの準備に失敗しました')
        }

        const { token, path } = await response.json()

        // Step 2: Upload file directly to Supabase Storage (bypasses Vercel limit)
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .uploadToSignedUrl(path, token, file, {
            contentType: 'application/pdf',
          })

        if (uploadError) {
          throw new Error('ファイルのアップロードに失敗しました')
        }

        setUploadProgress(100)
        onUploadComplete?.(path)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
      } finally {
        setUploading(false)
      }
    },
    [onUploadComplete]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null)

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0]
        if (rejection.errors.some((e) => e.message.includes('file type'))) {
          setError('PDFファイルのみアップロード可能です')
        } else if (rejection.errors.some((e) => e.message.includes('larger'))) {
          setError('ファイルサイズは10MB以下にしてください')
        } else {
          setError('ファイルをアップロードできませんでした')
        }
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        onFileSelect(file)
        handleUpload(file)
      }
    },
    [onFileSelect, handleUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (selectedFile) {
    return (
      <div className={cn('rounded-lg border bg-white p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {onRemove && !uploading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploading && (
          <div className="mt-3">
            <Progress value={uploadProgress} className="h-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              アップロード中...
            </p>
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-emerald-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <Upload
          className={cn(
            'h-10 w-10',
            isDragActive ? 'text-primary' : 'text-gray-400'
          )}
        />
        <p className="mt-4 font-medium text-gray-700">
          ファイルをドラッグ＆ドロップ
        </p>
        <p className="mt-1 text-sm text-muted-foreground">または</p>
        <Button type="button" variant="outline" className="mt-3">
          ファイルを選択
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          PDF形式 / 最大10MB
        </p>
      </div>
      {error && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
