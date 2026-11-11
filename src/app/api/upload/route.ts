import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST() {
  try {
    const supabase = createServerClient()
    const fileId = uuidv4()
    const filePath = `original/${fileId}.pdf`

    const { data, error } = await supabase.storage
      .from('contracts')
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Signed URL error:', error)
      return NextResponse.json(
        { error: '署名付きURLの生成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      token: data.token,
      path: filePath,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    )
  }
}
