'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SignaturePosition } from '@/types'

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

interface SignatureBox {
  id: 'own' | 'client'
  label: string
  position: SignaturePosition | null
}

interface PDFViewerProps {
  url: string
  signatureBoxes: SignatureBox[]
  onPositionChange: (id: 'own' | 'client', position: SignaturePosition) => void
  className?: string
}

export function PDFViewer({
  url,
  signatureBoxes,
  onPositionChange,
  className,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState<'own' | 'client' | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height })
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages))
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, boxId: 'own' | 'client', box: SignatureBox) => {
      if (!box.position) return
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setDragging(boxId)
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !pageRef.current) return

      const pageRect = pageRef.current.getBoundingClientRect()
      const box = signatureBoxes.find((b) => b.id === dragging)
      if (!box?.position) return

      const x = (e.clientX - pageRect.left - dragOffset.x) / scale
      const y = (e.clientY - pageRect.top - dragOffset.y) / scale

      // Keep within bounds
      const maxX = pageSize.width - box.position.width
      const maxY = pageSize.height - box.position.height
      const clampedX = Math.max(0, Math.min(x, maxX))
      const clampedY = Math.max(0, Math.min(y, maxY))

      onPositionChange(dragging, {
        ...box.position,
        page: currentPage,
        x: clampedX,
        y: clampedY,
      })
    },
    [dragging, dragOffset, scale, pageSize, currentPage, signatureBoxes, onPositionChange]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const boxId = e.dataTransfer.getData('boxId') as 'own' | 'client'
      if (!boxId || !pageRef.current) return

      const pageRect = pageRef.current.getBoundingClientRect()
      const x = (e.clientX - pageRect.left) / scale
      const y = (e.clientY - pageRect.top) / scale

      onPositionChange(boxId, {
        page: currentPage,
        x: Math.max(0, x - 100), // Center the box
        y: Math.max(0, y - 25),
        width: 200,
        height: 50,
      })
    },
    [currentPage, scale, onPositionChange]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className={cn('flex gap-4', className)}>
      {/* Sidebar with signature boxes to drag */}
      <div className="w-48 flex-shrink-0 space-y-4">
        <h3 className="font-semibold text-gray-900">署名欄</h3>
        <p className="text-xs text-muted-foreground">
          署名欄をPDFにドラッグして配置してください
        </p>
        <div className="space-y-3">
          {signatureBoxes.map((box) => (
            <div
              key={box.id}
              draggable={!box.position}
              onDragStart={(e) => {
                e.dataTransfer.setData('boxId', box.id)
              }}
              className={cn(
                'cursor-move rounded-lg p-3 text-center text-sm font-medium transition-all',
                box.id === 'own'
                  ? 'border-2 border-dashed border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-2 border-dashed border-blue-500 bg-blue-50 text-blue-700',
                box.position && 'cursor-default opacity-50'
              )}
            >
              {box.id === 'own' ? '🟢 自社署名' : '🔵 クライアント署名'}
              {box.position && (
                <span className="mt-1 block text-xs opacity-70">配置済み</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1">
        <div
          ref={containerRef}
          className="relative overflow-auto rounded-lg border bg-gray-100"
          style={{ height: '60vh' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={pageRef}
            className="relative inline-block"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <PDFDocument file={url} onLoadSuccess={onDocumentLoadSuccess}>
              <PDFPage
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </PDFDocument>

            {/* Signature boxes overlay */}
            {signatureBoxes.map(
              (box) =>
                box.position &&
                box.position.page === currentPage && (
                  <div
                    key={box.id}
                    onMouseDown={(e) => handleMouseDown(e, box.id, box)}
                    style={{
                      position: 'absolute',
                      left: box.position.x * scale,
                      top: box.position.y * scale,
                      width: box.position.width * scale,
                      height: box.position.height * scale,
                    }}
                    className={cn(
                      'flex cursor-move items-center justify-center rounded text-xs font-medium transition-shadow',
                      box.id === 'own'
                        ? 'border-2 border-dashed border-emerald-500 bg-emerald-100/80 text-emerald-700'
                        : 'border-2 border-dashed border-blue-500 bg-blue-100/80 text-blue-700',
                      dragging === box.id && 'shadow-lg'
                    )}
                  >
                    {box.id === 'own' ? '自社署名' : 'クライアント署名'}
                  </div>
                )
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {numPages}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={scale >= 2}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
