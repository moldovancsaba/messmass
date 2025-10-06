// app/api/admin/local-users/[id]/route.ts
// WHAT: Update or delete a specific user
// WHY: Enable password regeneration and user deletion from admin panel

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import config from '@/lib/config'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'

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
  try {
    // Check authentication
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super-admin can regenerate passwords
    if (admin.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden: Only super-admin can regenerate passwords' }, { status: 403 })
    }

    const userId = params.id
    const body = await request.json()

    // Validate user ID
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(config.dbName)
    const usersCollection = db.collection('users')

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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

      console.log(`🔐 Password regenerated for user: ${user.email}`)

      return NextResponse.json({
        success: true,
        password: newPassword,
        message: 'Password regenerated successfully'
      })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  try {
    // Check authentication
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super-admin can delete users
    if (admin.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden: Only super-admin can delete users' }, { status: 403 })
    }

    const userId = params.id

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

    console.log(`🗑️  User deleted: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
