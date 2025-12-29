// WHAT: User preferences API - Store/fetch user-specific settings
// WHY: Remember user choices (like last selected template) across browsers and sessions
// HOW: Store in MongoDB user_preferences collection, keyed by user email

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { error as logError } from '@/lib/logger';

interface UserPreferences {
  userId: string; // User email/identifier
  lastSelectedTemplateId?: string;
  updatedAt: string;
}

/**
 * GET /api/user-preferences
 * Fetch current user's preferences
 */
export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const db = await getDb();
    const preferencesCollection = db.collection<UserPreferences>('user_preferences');
    
    const preferences = await preferencesCollection.findOne({ userId: user.email });
    
    return NextResponse.json({
      success: true,
      preferences: preferences || { userId: user.email }
    });
  } catch (error) {
    logError('Failed to fetch user preferences', { context: 'user-preferences' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user-preferences
 * Update current user's preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { lastSelectedTemplateId } = body;
    
    const db = await getDb();
    const preferencesCollection = db.collection<UserPreferences>('user_preferences');
    
    const now = new Date().toISOString();
    
    await preferencesCollection.updateOne(
      { userId: user.email },
      {
        $set: {
          ...(lastSelectedTemplateId !== undefined && { lastSelectedTemplateId }),
          updatedAt: now
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated'
    });
  } catch (error) {
    logError('Failed to update user preferences', { context: 'user-preferences' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
