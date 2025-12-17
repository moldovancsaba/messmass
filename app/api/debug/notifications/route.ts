import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getAdminUser } from '@/lib/auth';

/* WHAT: Diagnostic endpoint to test notification system
 * WHY: Help troubleshoot why notifications aren't appearing
 * 
 * GET: Check notification system status and list recent notifications */

export async function GET(request: NextRequest) {
  try {
    // Check 1: Authentication
    const user = await getAdminUser();
    const authStatus = {
      authenticated: !!user,
      userId: user?.id || null,
      userName: user?.name || null,
      userEmail: user?.email || null
    };

    // Check 2: Database connection
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // Check 3: Notifications collection
    const notifications = db.collection('notifications');
    const notificationCount = await notifications.countDocuments({});
    const recentNotifications = await notifications
      .find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    // Check 4: Per-user notification count (if authenticated)
    let userNotificationInfo = null;
    if (user) {
      const unreadCount = await notifications.countDocuments({
        readBy: { $ne: user.id },
        archivedBy: { $ne: user.id }
      });
      const userReadCount = await notifications.countDocuments({
        readBy: user.id
      });
      const userArchivedCount = await notifications.countDocuments({
        archivedBy: user.id
      });
      
      userNotificationInfo = {
        unreadCount,
        readCount: userReadCount,
        archivedCount: userArchivedCount,
        totalVisible: notificationCount - userArchivedCount
      };
    }

    // Check 5: Sample notification structure
    const sampleNotification = recentNotifications[0] || null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checks: {
        authentication: authStatus,
        database: {
          connected: true,
          totalNotifications: notificationCount
        },
        userNotifications: userNotificationInfo,
        recentNotifications: recentNotifications.map(n => ({
          _id: n._id.toString(),
          activityType: n.activityType,
          user: n.user,
          projectName: n.projectName,
          timestamp: n.timestamp,
          readBy: n.readBy || [],
          archivedBy: n.archivedBy || [],
          readByCount: (n.readBy || []).length,
          archivedByCount: (n.archivedBy || []).length
        })),
        sampleStructure: sampleNotification ? {
          hasReadByArray: Array.isArray(sampleNotification.readBy),
          hasArchivedByArray: Array.isArray(sampleNotification.archivedBy),
          hasOldReadBoolean: 'read' in sampleNotification
        } : null
      },
      troubleshooting: {
        message: !user 
          ? '❌ Not authenticated - Login to admin to see notifications'
          : notificationCount === 0
          ? '⚠️ No notifications in database - Create/edit a project to generate one'
          : userNotificationInfo && userNotificationInfo.unreadCount === 0
          ? '✅ All notifications read or archived for this user'
          : '✅ System working correctly'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}
