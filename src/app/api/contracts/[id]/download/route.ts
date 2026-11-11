import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Fetch the contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('pdf_path, signed_pdf_path, title')
      .eq('id', id)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '契約が見つかりません' }, { status: 404 })
    }

    // Use signed PDF if available, otherwise use original
    const pdfPath = contract.signed_pdf_path || contract.pdf_path

    // Download from storage
    const { data, error: downloadError } = await supabase.storage
      .from('contracts')
      .download(pdfPath)

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
