// app/api/admin/login/route.ts — Email + password admin login
// WHAT: Authenticates against local MongoDB Users collection; preserves legacy admin master fallback
// WHY: Enable multiple admin users while keeping existing simple cookie session model

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { findUserByEmail, updateUserLastLogin, verifyPassword, updateUserPasswordHash, hashPassword } from '@/lib/users'
import { FEATURE_FLAGS } from '@/lib/featureFlags'
import { env } from '@/lib/config'
import { logAuthSuccess, logAuthFailure, error as logError } from '@/lib/logger'

// Legacy env-based admin password has been removed. Authentication is fully DB-backed.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const emailRaw = (body?.email || '').toString()
    const password = (body?.password || '').toString()

    if (!emailRaw || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const email = emailRaw.toLowerCase()

    // Try to find user in DB (with alias support for 'admin' -> 'admin@messmass.com')
    let user = await findUserByEmail(email)
    if (!user && email === 'admin') {
      // WHAT: Allow 'admin' as a login alias for the canonical 'admin@messmass.com'.
      // WHY: Improves UX while keeping a single stored identity in the Users collection.
      const alias = await findUserByEmail('admin@messmass.com')
      if (alias) user = alias
    }

    // WHAT: Validate credentials with dual-write support (plaintext or bcrypt hash)
    // WHY: Zero-downtime migration - users can login with either format during transition
    // HOW: Check passwordHash first (new), fallback to plaintext password (legacy), migrate on success
    let isValid = false
    
    if (user) {
      if (user.passwordHash) {
        // WHAT: New secure password (bcrypt hash)
        // WHY: Feature flag enabled or user already migrated
        isValid = await verifyPassword(password, user.passwordHash)
      } else if (user.password) {
        // WHAT: Legacy plaintext password - validate and migrate
        // WHY: Gradually migrate users without forcing password reset
        isValid = user.password === password
        
        if (isValid && FEATURE_FLAGS.USE_BCRYPT_AUTH) {
          // WHAT: Migrate password to bcrypt on successful login
          // WHY: Gradually migrate users without forcing password reset
          // HOW: Hash the plaintext password and store as passwordHash
          try {
            const passwordHash = await hashPassword(password)
            await updateUserPasswordHash(user._id!.toString(), passwordHash)
            // Log migration for monitoring (no PII)
            logAuthSuccess(user._id!.toString(), request.headers.get('x-forwarded-for') || undefined)
          } catch (migrationError) {
            // WHAT: Log migration error but don't block login
            // WHY: User can still login, migration will retry on next login
            logError('Password migration failed during login', {
              userId: user._id!.toString(),
              error: migrationError instanceof Error ? migrationError.message : 'Unknown error'
            })
          }
        }
      }
    }

    if (!isValid) {
      // WHAT: Brute force protection delay
      // WHY: Prevent rapid password guessing attacks
      await new Promise((r) => setTimeout(r, 800))
      
      // WHAT: Log authentication failure (no PII - email is logged but redacted by logger)
      // WHY: Security monitoring and audit trail
      logAuthFailure(email, 'Invalid password', request.headers.get('x-forwarded-for') || undefined)
      
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // WHAT: Update lastLogin timestamp for successful login
    // WHY: Track when users last accessed the system
    if (user?._id) {
      await updateUserLastLogin(user._id.toString())
    }

    // Note: Legacy bootstrap via env password is removed.
    // If you need to create the initial super-admin, use the Admin → Users page
    // (or insert directly in the Users collection), then log in with that credential.

    // Build session token (7 days)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const tokenData = {
      token,
      expiresAt: expiresAt.toISOString(),
      userId: user?._id?.toString() || 'admin',
      // Normalize role to canonical set used across app ('guest'|'user'|'admin'|'superadmin'|'api')
      role: (user?.role || 'superadmin') as 'guest' | 'user' | 'admin' | 'superadmin' | 'api'
    }

    const signedToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    // WHAT: Set cookie with environment-aware configuration  
    // WHY: Each domain gets its own cookie - this is correct behavior
    //      CRITICAL: Must delete old cookie first to prevent stale sessions
    const cookieStore = await cookies()
    const isProduction = env.get('NODE_ENV') === 'production'
    
    // WHAT: Log authentication success (no PII - logger redacts sensitive data)
    // WHY: Security monitoring and audit trail
    // NOTE: user is guaranteed to exist at this point (isValid check above)
    if (user?._id) {
      logAuthSuccess(user._id.toString(), request.headers.get('x-forwarded-for') || undefined)
    }
    
    // CRITICAL: Delete any existing cookie first to prevent stale cookie issues
    // WHY: Browsers may keep old cookies that reference deleted users
    //      Must set maxAge=0 to tell browser to delete the cookie
    cookieStore.set('admin-session', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0, // Tell browser to delete the cookie
      path: '/'
    })
    
    // Now set the new cookie on response (more reliable across runtimes)
    const response = NextResponse.json({ success: true, token: signedToken, message: 'Login successful' })

    // Determine cookie domain for production (supports apex and www)
    const host = request.headers.get('host') || ''
    const domain = isProduction && host.endsWith('messmass.com') ? '.messmass.com' : undefined

    response.cookies.set('admin-session', signedToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      domain,
    })

    // Cookie set successfully - no logging needed (already logged auth success)

    // CORS: Echo allowed origin and credentials for cross-origin admin consoles
    const origin = request.headers.get('origin') || ''
    if (origin) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Vary', 'Origin')
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    return response
  } catch (error) {
    // WHAT: Log authentication error (logger redacts sensitive data)
    // WHY: Security monitoring and debugging
    logError('Admin login error', {
      pathname: '/api/admin/login',
      method: 'POST',
      ip: request.headers.get('x-forwarded-for') || undefined
    }, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
