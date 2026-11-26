import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  embedSignature,
  downloadPdfFromStorage,
  uploadPdfToStorage,
  loadJapaneseFont,
} from '@/lib/pdf/embed-signature'
import { sendSignRequestEmail } from '@/lib/email/send'
import { OWN_COMPANY_NAME } from '@/lib/config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { id } = await params
    const supabase = createServerClient()

    // Fetch the contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '契約が見つかりません' }, { status: 404 })
    }

    if (contract.status !== 'draft') {
      return NextResponse.json(
        { error: 'この契約は既に送信済みです' },
        { status: 400 }
      )
    }

    // Download the original PDF and load Japanese font
    const [pdfBytes, fontBytes] = await Promise.all([
      downloadPdfFromStorage(supabase, 'contracts', contract.pdf_path),
      loadJapaneseFont(),
    ])

    // Embed the own signature with Japanese font
    const signedPdfBytes = await embedSignature({
      pdfBytes,
      signatureText: contract.own_signature_text,
      position: contract.own_signature_position,
      fontBytes,
    })

    // Upload the signed PDF
    const signedPdfPath = `signed/${contract.id}.pdf`
    await uploadPdfToStorage(supabase, 'contracts', signedPdfPath, signedPdfBytes)

    // Update the contract status
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'pending',
        signed_pdf_path: signedPdfPath,
        own_signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update contract:', updateError)
      return NextResponse.json({ error: '契約の更新に失敗しました' }, { status: 500 })
    }

    // Send email to client
    const signUrl = `${APP_URL}/sign/${contract.sign_token}`
    await sendSignRequestEmail({
      to: contract.client_email,
      clientName: contract.client_name,
      companyName: OWN_COMPANY_NAME,
      contractTitle: contract.title,
      signUrl,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'エラーが発生しました' },
      { status: 500 }
    )
  }
}
