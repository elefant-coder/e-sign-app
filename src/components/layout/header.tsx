'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface HeaderProps {
  showNewButton?: boolean
}

export function Header({ showNewButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">EleSign</span>
        </Link>
        {showNewButton && (
          <Link href="/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
