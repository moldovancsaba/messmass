import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getAdminUser } from '@/lib/auth';

/* WHAT: Mark notifications as read or archived endpoint (multi-user support)
 * WHY: Allow each user to independently mark notifications as read or archived
 *      Uses MongoDB $addToSet to add user ID to readBy or archivedBy arrays
 * 
 * PUT: Mark one or more notifications as read/archived, or mark all as read */

export async function PUT(request: NextRequest) {
  try {
    // WHAT: Get current user ID for per-user actions
    // WHY: Each user has independent read/archive state
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

    // WHAT: Parse request body for action type and notification IDs
    // WHY: Support both read and archive actions, individual or bulk
    const body = await request.json();
    const { notificationIds, markAll, action = 'read' } = body;

    // WHAT: Validate action type
    // WHY: Only allow 'read' or 'archive' actions
    if (!['read', 'archive'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action: must be "read" or "archive"' },
        { status: 400 }
      );
    }

    // WHAT: Determine which array to update based on action
    // WHY: Separate read and archive tracking
    const fieldToUpdate = action === 'archive' ? 'archivedBy' : 'readBy';
    const updateOperation = {
      $addToSet: { [fieldToUpdate]: user.id }
    };

    let result;

    if (markAll) {
      // WHAT: Mark all unread/unarchived notifications for this user
      // WHY: Bulk action for clearing all notifications
      const filter: any = {};
      filter[fieldToUpdate] = { $ne: user.id };
      
      result = await notifications.updateMany(filter, updateOperation);
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // WHAT: Mark specific notifications as read/archived for this user
      // WHY: User clicked on individual notifications or archive button
      const objectIds = notificationIds.map((id: string) => new ObjectId(id));
      const filter: any = {
        _id: { $in: objectIds }
      };
      filter[fieldToUpdate] = { $ne: user.id };
      
      result = await notifications.updateMany(filter, updateOperation);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request: provide notificationIds array or markAll: true' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      modifiedCount: result.modifiedCount,
      userId: user.id
    });
  } catch (error) {
    console.error('Error marking notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications' },
      { status: 500 }
    );
  }
}
