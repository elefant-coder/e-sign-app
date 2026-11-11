import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Don't protect /sign/* or /api/sign/* (client signing pages)
  if (path.startsWith('/sign') || path.startsWith('/api/sign')) {
    return NextResponse.next()
  }

  // If no BASIC_AUTH_PASSWORD is set, skip auth
  const validPass = process.env.BASIC_AUTH_PASSWORD
  if (!validPass) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString()
      const [user, pass] = decoded.split(':')

      const validUser = process.env.BASIC_AUTH_USER || 'admin'

      if (user === validUser && pass === validPass) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="EleSign Admin"',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|sign|api/sign).*)'],
}
