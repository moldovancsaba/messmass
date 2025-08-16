// middleware.ts - Update this file to bypass SSO in development
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only apply to admin routes
  if (pathname.startsWith('/admin')) {
    // In development, bypass SSO and allow direct access
    if (process.env.NODE_ENV === 'development') {
      // Set a local admin session cookie
      const response = NextResponse.next()
      response.cookies.set('admin-session', 'local-dev-admin', {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      })
      return response
    }
    
    // In production, check for existing admin session
    const adminSession = request.cookies.get('admin-session')
    
    if (!adminSession) {
      // Redirect to SSO for authentication
      const returnUrl = encodeURIComponent(`${request.nextUrl.origin}${pathname}`)
      const ssoUrl = `https://sso.doneisbetter.com/login?return_url=${returnUrl}&app=messmass`
      return NextResponse.redirect(ssoUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}