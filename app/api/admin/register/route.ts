// app/api/admin/register/route.ts
// WHAT: User registration endpoint with automatic 'guest' role assignment
// WHY: Enable self-service registration, assign minimal permissions, allow promotion by superadmins
// HOW: Create user with generated password, set guest role, establish session

import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/users';
import { generateMD5StylePassword } from '@/lib/pagePassword';
import { logAuthSuccess, logAuthFailure, error as logError } from '@/lib/logger';
import { generateSessionToken, type SessionTokenData } from '@/lib/sessionTokens';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

/**
 * WHAT: POST handler for user registration
 * WHY: Allow new users to self-register with 'guest' role
 * SECURITY: No authentication required (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;
    
    // WHAT: Validate required fields
    if (!email?.trim() || !name?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }
    
    const emailLower = email.trim().toLowerCase();
    const nameTrimmed = name.trim();
    
    // WHAT: Check if email already exists
    // WHY: Prevent duplicate accounts
    const existingUser = await findUserByEmail(emailLower);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    // WHAT: Create user with 'guest' role
    // WHY: New users start with minimal permissions (help page only)
    const now = new Date().toISOString();
    const newUser = await createUser({
      email: emailLower,
      name: nameTrimmed,
      role: 'guest', // WHAT: Default role for self-registered users
      password: password.trim(), // WHAT: Store user-provided password
      createdAt: now,
      updatedAt: now,
    });
    
    // WHAT: Create session token with dual-format support
    // WHY: Auto-login user after registration, supports both JWT and Base64 formats
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const tokenData: SessionTokenData = {
      token: generateMD5StylePassword(), // Random token
      expiresAt: expiresAt.toISOString(),
      userId: newUser._id!.toString(),
      role: newUser.role,
    };
    
    // WHAT: Generate token based on feature flag (JWT or Base64)
    // WHY: Zero-downtime migration - supports both formats
    const encodedSession = generateSessionToken(tokenData);
    
    // WHAT: Set HTTP-only cookie
    // WHY: Secure session management, prevent XSS
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser._id!.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      message: 'Registration successful! Welcome to MessMass.',
    });
    
    response.cookies.set('admin-session', encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });
    
    // WHAT: Store token format indicator (for validation routing)
    // WHY: Helps middleware route to correct validator (JWT vs Base64)
    if (FEATURE_FLAGS.USE_JWT_SESSIONS) {
      response.cookies.set('session-format', 'jwt', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }
    
    // WHAT: Log successful registration (no PII - logger redacts sensitive data)
    // WHY: Security monitoring and audit trail
    logAuthSuccess(newUser._id!.toString(), request.headers.get('x-forwarded-for') || undefined);
    
    return response;
    
  } catch (error) {
    // WHAT: Log registration error (logger redacts sensitive data)
    // WHY: Security monitoring and debugging
    logError('User registration error', {
      pathname: '/api/admin/register',
      method: 'POST',
      ip: request.headers.get('x-forwarded-for') || undefined
    }, error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
