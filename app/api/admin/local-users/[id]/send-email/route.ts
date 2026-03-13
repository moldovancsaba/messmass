// app/api/admin/local-users/[id]/send-email/route.ts
// WHAT: Send regenerated password via email
// WHY: Allow admins to securely share passwords with users

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import config from '@/lib/config'
import { ObjectId } from 'mongodb'
import { sendPasswordRegeneratedEmail } from '@/lib/emailNotifications'
import { error as logError, info as logInfo } from '@/lib/logger'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  const userId = params.id
  
  try {
    // Check authentication
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can send password emails
    if (admin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Only superadmin can send passwords' }, { status: 403 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Validate user ID
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(config.dbName)
    const usersCollection = db.collection('users')

    // Get user details
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send email
    const success = await sendPasswordRegeneratedEmail({
      userEmail: user.email,
      password: password
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    logInfo('Password email sent', { context: 'admin-local-users', userId, userEmail: user.email })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })
  } catch (error) {
    logError('Error sending password email', { context: 'admin-local-users', userId: params.id || 'unknown' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
