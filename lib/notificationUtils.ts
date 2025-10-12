/* WHAT: Notification utility functions for logging project activities
 * WHY: Centralize notification creation logic to avoid code duplication
 * 
 * Used by project API routes to automatically log user activities */

import { Db } from 'mongodb';

export interface CreateNotificationParams {
  activityType: 'create' | 'edit' | 'edit-stats';
  user: string;
  projectId: string;
  projectName: string;
  projectSlug?: string | null;
}

/**
 * WHAT: Create a notification by writing directly to MongoDB
 * WHY: Logs user activities for display in the header bell notification panel
 *      Direct DB write avoids circular API calls from within API routes
 * 
 * @param db - MongoDB database instance
 * @param params - Notification parameters
 * @returns Promise resolving to success status
 */
export async function createNotification(db: Db, params: CreateNotificationParams): Promise<boolean> {
  try {
    const notifications = db.collection('notifications');

    // WHAT: Validate required fields
    // WHY: Ensure notification integrity
    if (!params.activityType || !params.user || !params.projectId || !params.projectName) {
      console.error('Missing required notification fields');
      return false;
    }

    // WHAT: Create notification document with ISO 8601 timestamp
    // WHY: Store activity for display in notification panel
    const timestamp = new Date().toISOString();
    const notification = {
      activityType: params.activityType,
      user: params.user,
      projectId: params.projectId,
      projectName: params.projectName,
      projectSlug: params.projectSlug || null,
      timestamp,
      read: false,
      createdAt: timestamp
    };

    await notifications.insertOne(notification);
    console.log(`✅ Notification created: ${params.user} ${params.activityType} "${params.projectName}"`);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * WHAT: Get user info from auth session
 * WHY: Extract user identity for notification logging using existing auth system
 * 
 * @returns Promise resolving to user name or 'Unknown User'
 */
export async function getCurrentUser(): Promise<string> {
  // WHAT: Import and use existing auth system to get current user
  // WHY: Reuse centralized authentication logic
  try {
    const { getAdminUser } = await import('./auth');
    const user = await getAdminUser();
    return user?.name || 'Admin User';
  } catch (error) {
    console.error('Error getting current user:', error);
    return 'Admin User';
  }
}
