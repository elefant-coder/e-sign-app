import { timingSafeEqual } from 'node:crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export type AdminAuthResult = 'ok' | 'unauthorized' | 'not-configured'

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

// 管理画面・管理 API の Basic 認証。パスワード未設定のときは通さない（fail closed）
export function checkBasicAuth(authHeader: string | null): AdminAuthResult {
  const validPass = process.env.BASIC_AUTH_PASSWORD
  if (!validPass) return 'not-configured'
  if (!authHeader) return 'unauthorized'

  const [scheme, encoded] = authHeader.split(' ')
  if (scheme !== 'Basic' || !encoded) return 'unauthorized'

  const decoded = Buffer.from(encoded, 'base64').toString()
  const sep = decoded.indexOf(':')
  if (sep < 0) return 'unauthorized'
  const user = decoded.slice(0, sep)
  const pass = decoded.slice(sep + 1)
  const validUser = process.env.BASIC_AUTH_USER || 'admin'

  return safeEqual(user, validUser) && safeEqual(pass, validPass) ? 'ok' : 'unauthorized'
}

export function adminAuthResponse(result: Exclude<AdminAuthResult, 'ok'>): NextResponse {
  if (result === 'not-configured') {
    return new NextResponse('BASIC_AUTH_PASSWORD が設定されていません', { status: 503 })
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="EleSign Admin"' },
  })
}

// 管理 API の各ハンドラの先頭で呼ぶ（Proxy だけに頼らない）
export async function requireAdmin(): Promise<NextResponse | null> {
  const result = checkBasicAuth((await headers()).get('authorization'))
  return result === 'ok' ? null : adminAuthResponse(result)
}
