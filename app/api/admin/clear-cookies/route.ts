// app/api/admin/clear-cookies/route.ts
// WHAT: Utility endpoint to forcefully clear all admin cookies
// WHY: Help users recover from stale cookie issues

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { env } from '@/lib/config'
import { error as logError, info as logInfo } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Delete admin-session cookie via server store
    cookieStore.delete('admin-session')

    // Also set an explicit deletion cookie with matching attributes
    const isProduction = env.get('NODE_ENV') === 'production'
    const host = (request.headers.get('host') || '')
    const domain = isProduction && host.endsWith('messmass.com') ? '.messmass.com' : undefined

    const response = NextResponse.json({ 
      success: true, 
      message: 'All admin cookies cleared. Please login again.' 
    })

    response.cookies.set('admin-session', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain,
    })
    
    logInfo('Cleared admin-session cookie', { context: 'admin-clear-cookies', domain })
    
    return response
  } catch (error) {
    logError('Error clearing cookies', { context: 'admin-clear-cookies' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cookies' 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
