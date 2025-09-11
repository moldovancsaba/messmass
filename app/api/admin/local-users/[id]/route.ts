// app/api/admin/local-users/[id]/route.ts
// WHAT: Admin-only endpoints (PUT regenerate password, DELETE user)
// WHY: Allow secure one-click password regeneration and user removal

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { deleteUser, findUserById, updateUserPassword } from '@/lib/users'
import { generateMD5StylePassword } from '@/lib/pagePassword'

// WHAT: Force Node.js runtime for this route.
// WHY: Password regeneration uses Node's crypto (randomBytes) via lib/pagePassword.ts.
// Explicitly declaring 'nodejs' prevents Edge runtime incompatibilities.
export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const regenerate = !!body?.regeneratePassword

    if (!regenerate) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 })
    }

    // Generate new password
    const newPassword = generateMD5StylePassword()
    const updated = await updateUserPassword(id, newPassword)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, password: newPassword, updatedAt: updated.updatedAt })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })

    const { id } = await context.params
    const user = await findUserById(id)
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    // Guards
    if (admin.id === id) {
      return NextResponse.json({ success: false, error: 'Cannot delete the currently authenticated user' }, { status: 400 })
    }
    if (user.role === 'super-admin') {
      // Optional: in the future, count super-admins and allow if more than 1
      return NextResponse.json({ success: false, error: 'Cannot delete a super-admin' }, { status: 400 })
    }

    const ok = await deleteUser(id)
    if (!ok) return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}

