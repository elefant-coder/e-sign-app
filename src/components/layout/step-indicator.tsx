'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  number: number
  label: string
}

const steps: Step[] = [
  { number: 1, label: '文書登録' },
  { number: 2, label: '送信先' },
  { number: 3, label: '署名位置' },
  { number: 4, label: '確認' },
]

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  step.number < currentStep
                    ? 'border-primary bg-primary text-white'
                    : step.number === currentStep
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                )}
              >
                {step.number < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  step.number <= currentStep ? 'text-primary' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-12 sm:w-20',
                  step.number < currentStep ? 'bg-primary' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
