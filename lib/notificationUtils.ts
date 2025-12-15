/* WHAT: Notification utility functions for logging project activities
 * WHY: Centralize notification creation logic to avoid code duplication
 * 
 * Used by project API routes to automatically log user activities */

import { Db } from 'mongodb';

export interface CreateNotificationParams {
  activityType: 'create' | 'edit' | 'edit-stats' | 'api_stats_update' | 'webhook_disabled' | 'webhook_failed';
  user: string;
  projectId: string;
  projectName: string;
  projectSlug?: string | null;
  apiUser?: {
    id: string;
    email: string;
  };
  modifiedFields?: string[];
  metadata?: {
    webhookId?: string;
    reason?: string;
    [key: string]: any;
  };
}

/**
 * WHAT: Create a notification by writing directly to MongoDB with intelligent grouping
 * WHY: Logs user activities for display in the header bell notification panel
 *      Groups rapid consecutive edits to prevent notification spam
 *      Direct DB write avoids circular API calls from within API routes
 * 
 * STRATEGY: If a similar notification (same user, activity, project) exists within
 *           the last 5 minutes, update its timestamp instead of creating a duplicate.
 *           This groups rapid edits during a single workflow into one notification.
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

    const now = new Date();
    const timestamp = now.toISOString();
    
    // WHAT: Calculate 5-minute window for grouping notifications
    // WHY: Group rapid consecutive edits from the same user on the same project
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    
    // WHAT: Check if a similar notification exists within the last 5 minutes
    // WHY: Prevent notification spam during rapid editing workflows
    const existingNotification = await notifications.findOne({
      user: params.user,
      activityType: params.activityType,
      projectId: params.projectId,
      timestamp: { $gte: fiveMinutesAgo }
    });
    
    if (existingNotification) {
      // WHAT: Update existing notification timestamp to show latest activity
      // WHY: Groups rapid edits into single notification while keeping it fresh
      await notifications.updateOne(
        { _id: existingNotification._id },
        { 
          $set: { 
            timestamp,
            projectName: params.projectName, // Update name in case it changed
            projectSlug: params.projectSlug || existingNotification.projectSlug || null
          }
        }
      );
      console.log(`🔄 Notification grouped: ${params.user} ${params.activityType} "${params.projectName}" (updated existing)`);
      return true;
    }
    
    // WHAT: Create new notification document with ISO 8601 timestamp and empty arrays
    // WHY: No recent similar notification exists - create a fresh one
    const notification: any = {
      activityType: params.activityType,
      user: params.user,
      projectId: params.projectId,
      projectName: params.projectName,
      projectSlug: params.projectSlug || null,
      timestamp,
      readBy: [],           // Array of user IDs who have read this notification
      archivedBy: [],       // Array of user IDs who have archived this notification
      createdAt: timestamp
    };
    
    // WHAT: Add API-specific fields for API activity notifications
    // WHY: Track which API user made the change and what fields were modified
    if (params.activityType === 'api_stats_update' && params.apiUser) {
      notification.apiUser = params.apiUser;
    }
    
    if (params.modifiedFields && params.modifiedFields.length > 0) {
      notification.modifiedFields = params.modifiedFields;
    }
    
    // WHAT: Add webhook-specific metadata
    // WHY: Track webhook failures and auto-disable events
    if ((params.activityType === 'webhook_disabled' || params.activityType === 'webhook_failed') && params.metadata) {
      notification.metadata = params.metadata;
    }

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
