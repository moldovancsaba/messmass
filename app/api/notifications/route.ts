export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/auth';

/* WHAT: Multi-user notifications API endpoint for shared activity notifications
 * WHY: Track project creation, edits, and stat updates visible to all users
 *      Each user can independently mark notifications as read or archived
 * 
 * GET: Fetch notifications with per-user read/archive status and unread count
 * POST: Create new notification (called by project operations) */

export async function GET(request: NextRequest) {
  try {
    // WHAT: Get current user ID for per-user filtering
    // WHY: Each user sees their own read/archive status
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const notifications = db.collection('notifications');

    // WHAT: Parse query parameters for pagination and filtering
    // WHY: Support infinite scroll, read-only, and archived views
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const archivedOnly = searchParams.get('archivedOnly') === 'true';
    const excludeArchived = searchParams.get('excludeArchived') === 'true';

    // WHAT: Build filter query based on user's read/archive status
    // WHY: Each user has independent read/archive state
    const filter: any = {};
    
    if (unreadOnly) {
      // Show only notifications not read by this user
      filter.readBy = { $ne: user.id };
    }
    
    if (archivedOnly) {
      // Show only notifications archived by this user
      filter.archivedBy = user.id;
    } else if (excludeArchived) {
      // Default: exclude archived notifications
      filter.archivedBy = { $ne: user.id };
    }

    // WHAT: Fetch notifications sorted by timestamp descending (newest first)
    // WHY: Users want to see most recent activities first
    const notificationsList = await notifications
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // WHAT: Count total and unread notifications for current user
    // WHY: Display badge count and support pagination
    const totalCount = await notifications.countDocuments(filter);
    const unreadCount = await notifications.countDocuments({
      readBy: { $ne: user.id },
      archivedBy: { $ne: user.id }
    });

    return NextResponse.json({
      success: true,
      notifications: notificationsList,
      pagination: {
        offset,
        limit,
        totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      },
      unreadCount,
      currentUserId: user.id
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const notifications = db.collection('notifications');

    // WHAT: Parse notification data from request body
    // WHY: Create notification from project operations
    const body = await request.json();
    const {
      activityType,
      user,
      projectId,
      projectName,
      projectSlug
    } = body;

    // WHAT: Validate required fields
    // WHY: Ensure notification integrity
    if (!activityType || !user || !projectId || !projectName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // WHAT: Validate activity type
    // WHY: Only allow specific activity types
    const validTypes = ['create', 'edit', 'edit-stats'];
    if (!validTypes.includes(activityType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // WHAT: Create notification document with ISO 8601 timestamp and empty read/archive arrays
    // WHY: Multi-user support - each user can independently mark as read or archived
    const timestamp = new Date().toISOString();
    const notification = {
      activityType,
      user,
      projectId,
      projectName,
      projectSlug: projectSlug || null,
      timestamp,
      readBy: [],           // Array of user IDs who have read this notification
      archivedBy: [],       // Array of user IDs who have archived this notification
      createdAt: timestamp
    };

    const result = await notifications.insertOne(notification);

    return NextResponse.json({
      success: true,
      notificationId: result.insertedId,
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
