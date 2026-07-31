// app/api/admin/login/route.ts — SSO-only admin auth
// WHAT: Local email/password login has been removed; SSO (sso.doneisbetter.com)
//     is now the only way to sign in, matching camera/launchmass.
// WHY: SSO_EMAIL_UNIFICATION_PLAN.md Phase 4 follow-up. Having a parallel local
//     login meant messmass genuinely had two separate user systems instead of
//     one unified one.
// NOTE: DELETE (logout) is unchanged and still works for any existing session,
//     regardless of whether it was minted via SSO or (historically) locally.

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { env } from '@/lib/config'
import { error as logError } from '@/lib/logger'

export async function POST() {
  return NextResponse.json(
    { error: 'Local login has been removed. Sign in with DoneIsBetter instead.', ssoLoginUrl: '/api/auth/sso/login' },
    { status: 410 }
  )
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isProduction = env.get('NODE_ENV') === 'production'

    // WHAT: Delete cookie with same attributes as login to ensure browser removes it
    // WHY: Cookie deletion must match the original cookie's domain/path/secure settings
    const host = request.headers.get('host') || ''
    const domain = isProduction && host.endsWith('messmass.com') ? '.messmass.com' : undefined

    // WHAT: Delete session cookie
    // WHY: Invalidate user session on logout
    cookieStore.delete('admin-session')

    cookieStore.delete('auth-source')

    // Also set explicit deletion response cookie
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    response.cookies.set('admin-session', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0, // Delete immediately
      path: '/',
      domain,
    })
    response.cookies.set('auth-source', '', {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain,
    })

    return response
  } catch (error) {
    // WHAT: Log logout error (logger redacts sensitive data)
    // WHY: Security monitoring and debugging
    logError('Admin logout error', {
      pathname: '/api/admin/login',
      method: 'DELETE',
      ip: request.headers.get('x-forwarded-for') || undefined
    }, error instanceof Error ? error : new Error(String(error)))

    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
