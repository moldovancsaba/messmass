export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/auth';
import config from '@/lib/config';

/* WHAT: Multi-user notifications API endpoint for shared activity notifications
 * WHY: Track project creation, edits, and stat updates visible to all users
 *      Each user can independently mark notifications as read or archived
 *
 * GET: Fetch notifications with per-user read/archive status and unread count
 *
 * Notification CREATION is intentionally NOT exposed over HTTP. All notifications
 * are written server-side through lib/notificationUtils.ts:createNotification(),
 * which derives the actor from the authenticated session and de-duplicates. A
 * public POST create path previously existed here; it was unauthenticated
 * (any client could forge notifications) and bypassed the de-dup/grouping logic,
 * so it was removed. See docs/audits/notification-system-audit-2026-07-05.md (C2/H5). */

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
const db = client.db(config.dbName);
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

