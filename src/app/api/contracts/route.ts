import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const {
      title,
      pdf_path,
      client_company,
      client_name,
      client_email,
      own_signature_text,
      own_signature_position,
      client_signature_position,
    } = body

    // Validate required fields
    if (
      !title ||
      !pdf_path ||
      !client_company ||
      !client_name ||
      !client_email ||
      !own_signature_text ||
      !own_signature_position ||
      !client_signature_position
    ) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        title,
        pdf_path,
        client_company,
        client_name,
        client_email,
        own_signature_text,
        own_signature_position,
        client_signature_position,
        status: 'draft',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: '契約の作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}
