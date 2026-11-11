'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignaturePreview } from './signature-preview'
import { Lightbulb } from 'lucide-react'

interface SignatureInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  variant?: 'own' | 'client'
}

export function SignatureInput({
  value,
  onChange,
  label,
  placeholder = '例：株式会社〇〇',
  variant = 'own',
}: SignatureInputProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11"
      />
      <div className="flex items-start space-x-2 text-sm text-muted-foreground">
        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
        <span>全角/半角スペースで改行されます</span>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">プレビュー:</p>
        <SignaturePreview text={value} variant={variant} />
      </div>
    </div>
  )
}
