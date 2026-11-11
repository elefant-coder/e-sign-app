'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SignaturePreviewProps {
  text: string
  className?: string
  variant?: 'own' | 'client'
}

export function SignaturePreview({
  text,
  className,
  variant = 'own',
}: SignaturePreviewProps) {
  // Split text by any whitespace (space, full-width space) into lines
  const lines = useMemo(() => {
    if (!text.trim()) return []
    return text.split(/[\s　]+/).filter(Boolean)
  }, [text])

  if (lines.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[60px] items-center justify-center rounded-lg border-2 border-dashed p-3 text-sm text-gray-400',
          variant === 'own' ? 'border-emerald-300' : 'border-blue-300',
          className
        )}
      >
        署名テキストを入力してください
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-3',
        variant === 'own'
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-blue-500 bg-blue-50',
        className
      )}
    >
      {lines.map((line, index) => (
        <p
          key={index}
          className={cn(
            'text-sm font-medium leading-relaxed',
            variant === 'own' ? 'text-emerald-800' : 'text-blue-800'
          )}
        >
          {line}
        </p>
      ))}
    </div>
  )
}
