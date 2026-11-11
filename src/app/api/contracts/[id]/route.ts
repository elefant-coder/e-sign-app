import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '契約が見つかりません' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Get contract first to delete associated files
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('pdf_path, signed_pdf_path')
      .eq('id', id)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '契約が見つかりません' }, { status: 404 })
    }

    // Delete files from storage
    const filesToDelete = [contract.pdf_path]
    if (contract.signed_pdf_path) {
      filesToDelete.push(contract.signed_pdf_path)
    }

    await supabase.storage.from('contracts').remove(filesToDelete)

    // Delete contract from database
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}
