'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { NewContractState, SignaturePosition } from '@/types'

const initialState: NewContractState = {
  step: 1,
  file: null,
  fileUrl: null,
  pdfPath: null,
  title: '',
  client: {
    company: '',
    name: '',
    email: '',
  },
  ownSignatureText: '',
  positions: {
    own: null,
    client: null,
  },
}

interface NewContractContextType {
  state: NewContractState
  setFile: (file: File | null) => void
  setFileUrl: (url: string | null) => void
  setPdfPath: (path: string | null) => void
  setTitle: (title: string) => void
  setClient: (client: NewContractState['client']) => void
  setOwnSignatureText: (text: string) => void
  setOwnPosition: (position: SignaturePosition | null) => void
  setClientPosition: (position: SignaturePosition | null) => void
  setStep: (step: 1 | 2 | 3 | 4) => void
  reset: () => void
  canProceedToStep2: boolean
  canProceedToStep3: boolean
  canProceedToStep4: boolean
}

const NewContractContext = createContext<NewContractContextType | null>(null)

const STORAGE_KEY = 'elesign-new-contract'

export function NewContractProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NewContractState>(initialState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // File cannot be stored in sessionStorage, so we skip it
        setState({ ...parsed, file: null })
      } catch {
        // Ignore parse errors
      }
    }
    setIsHydrated(true)
  }, [])

  // Save state to sessionStorage on change
  useEffect(() => {
    if (isHydrated) {
      const toStore = { ...state, file: null } // File cannot be stored
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    }
  }, [state, isHydrated])

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file }))
  }, [])

  const setFileUrl = useCallback((fileUrl: string | null) => {
    setState((prev) => ({ ...prev, fileUrl }))
  }, [])

  const setPdfPath = useCallback((pdfPath: string | null) => {
    setState((prev) => ({ ...prev, pdfPath }))
  }, [])

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }))
  }, [])

  const setClient = useCallback((client: NewContractState['client']) => {
    setState((prev) => ({ ...prev, client }))
  }, [])

  const setOwnSignatureText = useCallback((ownSignatureText: string) => {
    setState((prev) => ({ ...prev, ownSignatureText }))
  }, [])

  const setOwnPosition = useCallback((position: SignaturePosition | null) => {
    setState((prev) => ({
      ...prev,
      positions: { ...prev.positions, own: position },
    }))
  }, [])

  const setClientPosition = useCallback((position: SignaturePosition | null) => {
    setState((prev) => ({
      ...prev,
      positions: { ...prev.positions, client: position },
    }))
  }, [])

  const setStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const canProceedToStep2 = Boolean(state.pdfPath && state.title.trim())
  const canProceedToStep3 = Boolean(
    canProceedToStep2 &&
      state.client.company.trim() &&
      state.client.name.trim() &&
      state.client.email.trim() &&
      state.ownSignatureText.trim()
  )
  const canProceedToStep4 = Boolean(
    canProceedToStep3 && state.positions.own && state.positions.client
  )

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <NewContractContext.Provider
      value={{
        state,
        setFile,
        setFileUrl,
        setPdfPath,
        setTitle,
        setClient,
        setOwnSignatureText,
        setOwnPosition,
        setClientPosition,
        setStep,
        reset,
        canProceedToStep2,
        canProceedToStep3,
        canProceedToStep4,
      }}
    >
      {children}
    </NewContractContext.Provider>
  )
}

export function useNewContract() {
  const context = useContext(NewContractContext)
  if (!context) {
    throw new Error('useNewContract must be used within a NewContractProvider')
  }
  return context
}
