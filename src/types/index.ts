export type ContractStatus = 'draft' | 'pending' | 'completed' | 'expired'

export interface SignaturePosition {
  page: number
  x: number
  y: number
  width: number
  height: number
}

export interface Contract {
  id: string
  title: string
  pdf_path: string
  signed_pdf_path: string | null
  client_company: string
  client_name: string
  client_email: string
  own_signature_text: string
  own_signature_position: SignaturePosition
  own_signed_at: string | null
  client_signature_text: string | null
  client_signature_position: SignaturePosition
  client_signed_at: string | null
  sign_token: string
  status: ContractStatus
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateContractInput {
  title: string
  pdf_path: string
  client_company: string
  client_name: string
  client_email: string
  own_signature_text: string
  own_signature_position: SignaturePosition
  client_signature_position: SignaturePosition
}

export interface NewContractState {
  step: 1 | 2 | 3 | 4
  file: File | null
  fileUrl: string | null
  pdfPath: string | null
  title: string
  client: {
    company: string
    name: string
    email: string
  }
  ownSignatureText: string
  positions: {
    own: SignaturePosition | null
    client: SignaturePosition | null
  }
}

export interface SignPageData {
  contract: {
    id: string
    title: string
    client_company: string
    client_name: string
    own_signature_text: string
    client_signature_position: SignaturePosition
    status: ContractStatus
    expires_at: string | null
  }
  pdfUrl: string
}
