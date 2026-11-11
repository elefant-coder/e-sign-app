import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendSignRequestEmail } from '@/lib/email/send'
import { OWN_COMPANY_NAME } from '@/lib/config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (contract.status !== 'pending') {
      return NextResponse.json(
        { error: '署名待ちの契約のみ再送信できます' },
        { status: 400 }
      )
    }

    // Resend the email
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
    console.error('Resend error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'エラーが発生しました' },
      { status: 500 }
    )
  }
}
