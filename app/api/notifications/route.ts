import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/* WHAT: Notifications API endpoint for fetching user activity notifications
 * WHY: Track project creation, edits, and stat updates to display in header bell
 * 
 * GET: Fetch notifications with pagination and unread count
 * POST: Create new notification (called by project operations) */

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const notifications = db.collection('notifications');

    // WHAT: Parse query parameters for pagination
    // WHY: Support infinite scroll and limit initial load
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // WHAT: Build filter query
    // WHY: Support filtering by read status
    const filter = unreadOnly ? { read: false } : {};

    // WHAT: Fetch notifications sorted by timestamp descending (newest first)
    // WHY: Users want to see most recent activities first
    const notificationsList = await notifications
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // WHAT: Count total and unread notifications
    // WHY: Display badge count and support pagination
    const totalCount = await notifications.countDocuments(filter);
    const unreadCount = await notifications.countDocuments({ read: false });

    return NextResponse.json({
      success: true,
      notifications: notificationsList,
      pagination: {
        offset,
        limit,
        totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      },
      unreadCount
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

    // WHAT: Create notification document with ISO 8601 timestamp
    // WHY: Store activity for display in notification panel
    const timestamp = new Date().toISOString();
    const notification = {
      activityType,
      user,
      projectId,
      projectName,
      projectSlug: projectSlug || null,
      timestamp,
      read: false,
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
