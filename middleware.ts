// middleware.ts - Replace with simple password authentication
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isValidAdminSession(sessionToken: string): boolean {
  try {
    // Decode the session token
    const tokenData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    
    // Check if token has expired
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    
    if (now > expiresAt) {
      return false
    }

    // Check if it's a valid admin token
    return tokenData.userId === 'admin' && tokenData.role === 'super-admin'
    
  } catch (error) {
    // Invalid token format
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only apply to admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSession = request.cookies.get('admin-session')
    
    if (!adminSession || !isValidAdminSession(adminSession.value)) {
      // Redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}