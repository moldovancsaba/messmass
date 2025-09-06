// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Admin password from environment variable
import config from '@/lib/config'
const ADMIN_PASSWORD = config.adminPassword

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check password
    if (password !== ADMIN_PASSWORD) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Generate a session token
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create token data
    const tokenData = {
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      userId: 'admin',
      role: 'super-admin'
    }

    // Create a simple signed token
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

    return NextResponse.json({
      success: true,
      token: signedToken,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Add logout endpoint
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}