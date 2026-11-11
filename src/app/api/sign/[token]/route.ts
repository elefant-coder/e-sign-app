import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  embedSignature,
  downloadPdfFromStorage,
  uploadPdfToStorage,
  loadJapaneseFont,
} from '@/lib/pdf/embed-signature'
import { sendCompletionEmail } from '@/lib/email/send'
import { OWN_COMPANY_NAME } from '@/lib/config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// GET: Fetch contract data for signing page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createServerClient()

    // Fetch the contract by sign_token
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(
        'id, title, client_company, client_name, own_signature_text, client_signature_position, status, expires_at, signed_pdf_path'
      )
      .eq('sign_token', token)
      .single()

    if (error || !contract) {
      return NextResponse.json({ error: '無効なリンクです' }, { status: 404 })
    }

    // Check if already signed
    if (contract.status === 'completed') {
      return NextResponse.json(
        { error: 'この契約は既に署名済みです', completed: true },
        { status: 400 }
      )
    }

    // Check if expired
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'この署名リンクは有効期限が切れています' },
        { status: 400 }
      )
    }

    // Get PDF URL for preview
    const pdfPath = contract.signed_pdf_path
    if (!pdfPath) {
      return NextResponse.json(
        { error: 'PDFファイルが見つかりません' },
        { status: 404 }
      )
    }

    // Create a signed URL for the PDF (valid for 1 hour)
    const { data: urlData } = await supabase.storage
      .from('contracts')
      .createSignedUrl(pdfPath, 3600)

    return NextResponse.json({
      contract: {
        id: contract.id,
        title: contract.title,
        client_company: contract.client_company,
        client_name: contract.client_name,
        own_signature_text: contract.own_signature_text,
        client_signature_position: contract.client_signature_position,
        status: contract.status,
        expires_at: contract.expires_at,
      },
      pdfUrl: urlData?.signedUrl || null,
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}

// POST: Submit client signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createServerClient()
    const body = await request.json()

    const { signature_text } = body

    if (!signature_text || !signature_text.trim()) {
      return NextResponse.json(
        { error: '署名テキストを入力してください' },
        { status: 400 }
      )
    }

    // Fetch the contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('sign_token', token)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '無効なリンクです' }, { status: 404 })
    }

    // Validate status
    if (contract.status !== 'pending') {
      return NextResponse.json(
        { error: 'この契約は署名できません' },
        { status: 400 }
      )
    }

    // Check expiration
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'この署名リンクは有効期限が切れています' },
        { status: 400 }
      )
    }

    // Download the current PDF (with own signature) and load Japanese font
    const [pdfBytes, fontBytes] = await Promise.all([
      downloadPdfFromStorage(supabase, 'contracts', contract.signed_pdf_path),
      loadJapaneseFont(),
    ])

    // Embed the client signature with Japanese font
    const signedPdfBytes = await embedSignature({
      pdfBytes,
      signatureText: signature_text,
      position: contract.client_signature_position,
      fontBytes,
    })

    // Upload the fully signed PDF
    await uploadPdfToStorage(
      supabase,
      'contracts',
      contract.signed_pdf_path,
      signedPdfBytes
    )

    // Update the contract
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'completed',
        client_signature_text: signature_text,
        client_signed_at: now,
        updated_at: now,
      })
      .eq('id', contract.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: '契約の更新に失敗しました' },
        { status: 500 }
      )
    }

    // Send completion emails
    const formatDate = (date: string) => {
      return new Date(date).toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const signers = [
      { name: OWN_COMPANY_NAME, signedAt: formatDate(contract.own_signed_at) },
      {
        name: `${contract.client_company} ${contract.client_name}`,
        signedAt: formatDate(now),
      },
    ]

    // Convert PDF to base64 for attachment
    const pdfBase64 = Buffer.from(signedPdfBytes).toString('base64')

    const recipients = [contract.client_email]
    const recipientNames = [contract.client_name]

    if (ADMIN_EMAIL) {
      recipients.push(ADMIN_EMAIL)
      recipientNames.push('管理者')
    }

    const downloadUrl = `${APP_URL}/sign/${token}/complete`

    await sendCompletionEmail({
      to: recipients,
      recipientNames,
      contractTitle: contract.title,
      signers,
      downloadUrl,
      attachmentBase64: pdfBase64,
      attachmentFilename: `${contract.title}.pdf`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'エラーが発生しました' },
      { status: 500 }
    )
  }
}
