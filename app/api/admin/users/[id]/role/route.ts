// app/api/admin/users/[id]/role/route.ts
// WHAT: API endpoint to change user roles (superadmin only)
// WHY: Enable role promotion/demotion, prevent self-demotion
// HOW: Validate permissions, update role, log change

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { findUserById, getUsersCollection } from '@/lib/users';
import { ObjectId } from 'mongodb';
import type { UserRole } from '@/lib/users';

/**
 * WHAT: PUT handler to update user role
 * WHY: Allow superadmins to manage user permissions
 * SECURITY: Superadmin only, prevent self-demotion
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // WHAT: Check if current user is superadmin
    // WHY: Only superadmins can change roles
    const currentUser = await getAdminUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    const { newRole } = body as { newRole: UserRole };
    
    // WHAT: Validate new role
    const validRoles: UserRole[] = ['guest', 'user', 'admin', 'superadmin'];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
    // WHAT: Prevent self-demotion
    // WHY: Superadmins shouldn't accidentally lock themselves out
    if (id === currentUser.id && newRole !== 'superadmin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You cannot demote yourself. Ask another superadmin to change your role.' 
        },
        { status: 400 }
      );
    }
    
    // WHAT: Find target user
    const targetUser = await findUserById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // WHAT: Check if role actually changed
    // WHY: Skip unnecessary database update
    if (targetUser.role === newRole) {
      return NextResponse.json({
        success: true,
        message: 'Role unchanged',
        user: {
          id: targetUser._id!.toString(),
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
        },
      });
    }
    
    // WHAT: Update user role in database
    const now = new Date().toISOString();
    const usersCollection = await getUsersCollection();
    
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          role: newRole,
          updatedAt: now,
        } 
      }
    );
    
    // WHAT: Log role change for audit trail
    console.log(`✅ Role changed: ${targetUser.email} (${targetUser.role} → ${newRole}) by ${currentUser.email}`);
    
    // WHAT: Fetch updated user
    const updatedUser = await findUserById(id);
    
    return NextResponse.json({
      success: true,
      message: `Role updated to ${newRole}`,
      user: {
        id: updatedUser!._id!.toString(),
        email: updatedUser!.email,
        name: updatedUser!.name,
        role: updatedUser!.role,
      },
    });
    
  } catch (error) {
    console.error('❌ Role update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
