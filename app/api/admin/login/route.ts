// app/api/admin/login/route.ts — SSO-only admin auth
// WHAT: Local email/password login has been removed; SSO (sso.doneisbetter.com)
//     is now the only way to sign in, matching camera/launchmass.
// WHY: SSO_EMAIL_UNIFICATION_PLAN.md Phase 4 follow-up. Having a parallel local
//     login meant messmass genuinely had two separate user systems instead of
//     one unified one.
// NOTE: DELETE (logout) also revokes the SSO access/refresh tokens minted at
//     login (best-effort) -- clearing only messmass's own cookie left the
//     SSO tokens (and often SSO's own browser session) alive, so the next
//     SSO redirect would silently sign the user back in.

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { env } from '@/lib/config'
import { error as logError } from '@/lib/logger'
import { revokeToken } from '@/lib/auth/ssoOAuth'

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

    // WHAT: Revoke the SSO tokens minted at login, if any (best-effort --
    //     revocation failure must never block local logout).
    // WHY: Ending messmass's own session isn't enough on its own; the SSO
    //     tokens (and the access SSO itself grants from them) should die too.
    const ssoTokensRaw = cookieStore.get('sso-tokens')?.value
    if (ssoTokensRaw) {
      try {
        const ssoTokens = JSON.parse(ssoTokensRaw) as { access_token?: string; refresh_token?: string }
        if (ssoTokens.access_token) {
          await revokeToken(ssoTokens.access_token, 'access_token')
        }
        if (ssoTokens.refresh_token) {
          await revokeToken(ssoTokens.refresh_token, 'refresh_token')
        }
      } catch (revokeError) {
        logError('SSO token revocation failed (non-blocking)', {
          pathname: '/api/admin/login',
          method: 'DELETE',
        }, revokeError instanceof Error ? revokeError : new Error(String(revokeError)))
      }
    }

    // WHAT: Delete session cookies
    // WHY: Invalidate user session on logout
    cookieStore.delete('admin-session')
    cookieStore.delete('auth-source')
    cookieStore.delete('sso-tokens')

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
    // SECURITY: no `domain` here -- sso-tokens is minted host-only
    // (see mintSession.ts), so clearing it with the shared `.messmass.com`
    // domain wouldn't actually remove the host-only cookie the browser has.
    response.cookies.set('sso-tokens', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    // WHAT: Short-lived, non-sensitive marker so the very next SSO login
    //     attempt (however the user reaches it -- a dashboard link, a
    //     bookmark, /admin/login's own auto-redirect) forces SSO to show
    //     its real login screen instead of silently re-approving.
    // WHY: Revoking this app's SSO tokens doesn't end SSO's own browser
    //     session. Without this, only a login initiated with an explicit
    //     ?from_logout=true got prompt=login -- every other path back into
    //     SSO right after logout would just silently sign the user back in.
    response.cookies.set('post-logout', '1', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 120,
      path: '/',
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
