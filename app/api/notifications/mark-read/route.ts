import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/* WHAT: Mark notifications as read endpoint
 * WHY: Allow users to dismiss notifications and clear badge counts
 * 
 * PUT: Mark one or more notifications as read, or mark all as read */

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const notifications = db.collection('notifications');

    // WHAT: Parse request body for notification IDs
    // WHY: Support marking individual or all notifications as read
    const body = await request.json();
    const { notificationIds, markAll } = body;

    let result;

    if (markAll) {
      // WHAT: Mark all notifications as read
      // WHY: Bulk action for clearing all notifications
      result = await notifications.updateMany(
        { read: false },
        { $set: { read: true, readAt: new Date().toISOString() } }
      );
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // WHAT: Mark specific notifications as read
      // WHY: User clicked on individual notifications
      const objectIds = notificationIds.map((id: string) => new ObjectId(id));
      result = await notifications.updateMany(
        { _id: { $in: objectIds }, read: false },
        { $set: { read: true, readAt: new Date().toISOString() } }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request: provide notificationIds array or markAll: true' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
