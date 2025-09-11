// app/api/admin/local-users/route.ts
// WHAT: Admin-only CRUD endpoints (GET list, POST create) for local Users collection
// WHY: Enable managing multiple admin users; passwords are generated MD5-style per project rules

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createUser, listUsers } from '@/lib/users'
import { generateMD5StylePassword } from '@/lib/pagePassword'

// WHAT: Force Node.js runtime for this route.
// WHY: Password generation uses Node's crypto (randomBytes) via lib/pagePassword.ts.
// The Edge runtime lacks Node's crypto, so we must opt into 'nodejs' to avoid runtime errors.
export const runtime = 'nodejs'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })

    const users = await listUsers()
    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u._id?.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }))
    })
  } catch (error) {
    console.error('Failed to list users:', error)
    return NextResponse.json({ success: false, error: 'Failed to list users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })

    const body = await request.json()
    const emailRaw = (body?.email || '').toString()
    const name = (body?.name || '').toString()
    const email = emailRaw.toLowerCase()

    if (!email || !name) {
      return NextResponse.json({ success: false, error: 'Email and name are required' }, { status: 400 })
    }

    // Generate MD5-style password (looks like MD5 hash; simple random per project rule)
    const password = generateMD5StylePassword()
    const now = new Date().toISOString()

    const created = await createUser({
      email,
      name,
      role: 'admin',
      password,
      createdAt: now,
      updatedAt: now
    })

    return NextResponse.json({
      success: true,
      user: {
        id: created._id?.toString(),
        email: created.email,
        name: created.name,
        role: created.role,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt
      },
      // Return generated password ONCE so admin can share it securely
      password
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    console.error('Failed to create user:', message)
    // Duplicate email guard
    if (message.includes('E11000')) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 })
  }
}

