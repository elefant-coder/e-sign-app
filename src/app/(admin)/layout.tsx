'use client'

import { Header } from '@/components/layout/header'
import { NewContractProvider } from '@/contexts/new-contract-context'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NewContractProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>{children}</main>
      </div>
    </NewContractProvider>
  )
}
