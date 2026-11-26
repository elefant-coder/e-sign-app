import { NextRequest, NextResponse } from 'next/server'
import { adminAuthResponse, checkBasicAuth } from '@/lib/admin-auth'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 相手の署名ページ（/sign/*・/api/sign/*）は認証しない
  if (path.startsWith('/sign') || path.startsWith('/api/sign')) {
    return NextResponse.next()
  }

  const result = checkBasicAuth(request.headers.get('authorization'))
  return result === 'ok' ? NextResponse.next() : adminAuthResponse(result)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|sign|api/sign).*)'],
}
