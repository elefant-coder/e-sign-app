import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createServerClient()

    // Fetch the contract by sign_token
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('signed_pdf_path, title, status, expires_at')
      .eq('sign_token', token)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '契約が見つかりません' }, { status: 404 })
    }

    // 署名リンクの有効期限（30日）を過ぎたらダウンロードも止める
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'このリンクは有効期限が切れています' },
        { status: 410 }
      )
    }

    if (contract.status !== 'completed') {
      return NextResponse.json(
        { error: '署名が完了していません' },
        { status: 400 }
      )
    }

    if (!contract.signed_pdf_path) {
      return NextResponse.json(
        { error: 'PDFファイルが見つかりません' },
        { status: 404 }
      )
    }

    // Download from storage
    const { data, error: downloadError } = await supabase.storage
      .from('contracts')
      .download(contract.signed_pdf_path)

    if (downloadError || !data) {
      console.error('Download error:', downloadError)
      return NextResponse.json(
        { error: 'ファイルのダウンロードに失敗しました' },
        { status: 500 }
      )
    }

    // Return the PDF
    const arrayBuffer = await data.arrayBuffer()
    const filename = encodeURIComponent(`${contract.title}.pdf`)

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}
