'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepIndicator } from '@/components/layout/step-indicator'
import { useNewContract } from '@/contexts/new-contract-context'

const stepPaths = ['/new', '/new/recipient', '/new/positions', '/new/confirm']

export default function NewContractLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, setStep } = useNewContract()

  const currentStep = useMemo(() => {
    const index = stepPaths.indexOf(pathname)
    return index === -1 ? 1 : index + 1
  }, [pathname]) as 1 | 2 | 3 | 4

  useEffect(() => {
    setStep(currentStep)
  }, [currentStep, setStep])

  const handleBack = () => {
    if (currentStep === 1) {
      router.push('/')
    } else {
      router.push(stepPaths[currentStep - 2])
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center py-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </div>
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>
      <div className="container mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  )
}
