// app/api/admin/local-users/[id]/route.ts
// WHAT: Update or delete a specific user
// WHY: Enable password regeneration and user deletion from admin panel

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import config from '@/lib/config'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { error as logError, info as logInfo, debug as logDebug } from '@/lib/logger'

// WHAT: Force Node.js runtime for crypto operations
// WHY: Edge runtime doesn't support crypto.randomBytes
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  const userId = params.id
  try {
    // Check authentication
    const admin = await getAdminUser()
    if (!admin) {
      logInfo('PUT /api/admin/local-users/[id]: No admin user found', { context: 'admin-local-users', userId })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can regenerate passwords
    if (admin.role !== 'superadmin') {
      logInfo('PUT /api/admin/local-users/[id]: User is not superadmin', { context: 'admin-local-users', userId, adminEmail: admin.email, role: admin.role })
      return NextResponse.json({ error: 'Forbidden: Only superadmin can regenerate passwords' }, { status: 403 })
    }

    const body = await request.json()
    
    logDebug('PUT /api/admin/local-users/[id]', { context: 'admin-local-users', userId, adminEmail: admin.email, body })

    // Validate user ID
    if (!ObjectId.isValid(userId)) {
      logInfo('Invalid ObjectId', { context: 'admin-local-users', userId })
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(config.dbName)
    const usersCollection = db.collection('users')

    // Check if user exists
    logDebug('Looking for user', { context: 'admin-local-users', userId })
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      logInfo('User not found', { context: 'admin-local-users', userId })
      const allUsers = await usersCollection.find({}).toArray()
      logDebug('All users in collection', { context: 'admin-local-users', totalUsers: allUsers.length, userIds: allUsers.map(u => u._id.toString()) })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    logInfo('Found user', { context: 'admin-local-users', userId, userEmail: user.email })

    // Handle password regeneration
    if (body.regeneratePassword) {
      const newPassword = crypto.randomBytes(16).toString('hex')
      
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            password: newPassword,
            updatedAt: new Date().toISOString()
          } 
        }
      )

      logInfo('Password regenerated for user', { context: 'admin-local-users', userId, userEmail: user.email })

      return NextResponse.json({
        success: true,
        password: newPassword,
        message: 'Password regenerated successfully'
      })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    logError('Error updating user', { context: 'admin-local-users', userId: params.id || 'unknown' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  let userId: string | undefined;
  try {
    userId = params.id;
    // Check authentication
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can delete users
    if (admin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Only superadmin can delete users' }, { status: 403 })
    }

    // Validate user ID
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (userId === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(config.dbName)
    const usersCollection = db.collection('users')

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user
    await usersCollection.deleteOne({ _id: new ObjectId(userId) })

    logInfo('User deleted', { context: 'admin-local-users', userId, userEmail: user.email })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    logError('Error deleting user', { context: 'admin-local-users', userId: params.id || 'unknown' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
