// app/api/admin/login/route.ts — Email + password admin login
// WHAT: Authenticates against local MongoDB Users collection; preserves legacy admin master fallback
// WHY: Enable multiple admin users while keeping existing simple cookie session model

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import config from '@/lib/config'
import { findUserByEmail, createUser } from '@/lib/users'

// Legacy admin master password fallback (for compatibility and bootstrap)
const LEGACY_ADMIN_PASSWORD = config.adminPassword

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

    // Try to find user in DB
    let user = await findUserByEmail(email)

    // Validate credentials using requested storage pattern (plaintext-like MD5-style token)
    let isValid = false

    if (user && user.password === password) {
      isValid = true
    } else {
      // Compatibility: allow logging in as legacy admin with master password
      // Accept either 'admin' or 'admin@messmass.com' as identifier when using legacy admin
      const isAdminIdentifier = email === 'admin' || email === 'admin@messmass.com'
      if (isAdminIdentifier && password === LEGACY_ADMIN_PASSWORD) {
        isValid = true
      }
    }

    if (!isValid) {
      // Simple brute force protection delay
      await new Promise((r) => setTimeout(r, 800))
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Bootstrap: if valid via legacy admin and user not present, upsert a super-admin
    if (!user) {
      const isAdminIdentifier = email === 'admin' || email === 'admin@messmass.com'
      if (isAdminIdentifier && password === LEGACY_ADMIN_PASSWORD) {
        const now = new Date().toISOString()
        try {
          const created = await createUser({
            email: 'admin@messmass.com',
            name: 'Admin',
            role: 'super-admin',
            password: LEGACY_ADMIN_PASSWORD,
            createdAt: now,
            updatedAt: now
          })
          // for session
          user = created
        } catch (e) {
          // If unique constraint exists, try to read again
          const existing = await findUserByEmail('admin@messmass.com')
          if (existing) {
            user = existing
          }
        }
      }
    }

    // Build session token (7 days)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const tokenData = {
      token,
      expiresAt: expiresAt.toISOString(),
      userId: user?._id?.toString() || 'admin',
      role: (user?.role || 'super-admin') as 'admin' | 'super-admin'
    }

    const signedToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set('admin-session', signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return NextResponse.json({ success: true, token: signedToken, message: 'Login successful' })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
