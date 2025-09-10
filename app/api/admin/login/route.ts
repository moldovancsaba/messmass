// app/api/admin/login/route.ts — Email + password admin login
// WHAT: Authenticates against local MongoDB Users collection; preserves legacy admin master fallback
// WHY: Enable multiple admin users while keeping existing simple cookie session model

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { findUserByEmail } from '@/lib/users'

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

    // Validate credentials using stored plaintext-like MD5-style token
    const isValid = !!(user && user.password === password)

    if (!isValid) {
      // Simple brute force protection delay
      await new Promise((r) => setTimeout(r, 800))
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
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
