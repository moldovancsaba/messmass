# Notification System Integration Guide

## ✅ Completed Components

The notification system has been partially implemented with the following components:

### 1. API Endpoints Created
- **`/api/notifications`** (GET, POST) - Fetch and create notifications
- **`/api/notifications/mark-read`** (PUT) - Mark notifications as read

### 2. UI Components Created
- **`NotificationPanel.tsx`** - Dropdown panel displaying notifications
- **`NotificationPanel.module.css`** - Styling for the notification panel
- **`TopHeader.tsx`** (updated) - Bell icon with badge and panel integration

### 3. Utilities Created
- **`lib/notificationUtils.ts`** - Helper functions for creating notifications

---

## 🔧 Remaining Integration Steps

To complete the notification system, you need to add notification logging to the project operations. Here's where to add the code:

### Step 1: Import notification utilities in project API routes

Add this import at the top of `/app/api/projects/route.ts`:

```typescript
import { createNotification, getCurrentUser } from '@/lib/notificationUtils';
```

### Step 2: Add notification logging after project creation

In `/app/api/projects/route.ts`, after line 416 (`const result = await collection.insertOne(project);`), add:

```typescript
// WHAT: Log notification for project creation
// WHY: Notify users of new project activity
try {
  const user = await getCurrentUser();
  await createNotification(db, {
    activityType: 'create',
    user,
    projectId: result.insertedId.toString(),
    projectName: eventName,
    projectSlug: viewSlug
  });
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
  // Don't fail the request if notification fails
}
```

### Step 3: Add notification logging after project update

In `/app/api/projects/route.ts`, find the PUT function (around line 440) and after the update operation completes successfully, add:

```typescript
// WHAT: Log notification for project edit
// WHY: Notify users of project changes
try {
  const user = await getCurrentUser();
  await createNotification(db, {
    activityType: 'edit',
    user,
    projectId: projectId,
    projectName: eventName,
    projectSlug: currentProject.viewSlug || null
  });
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
  // Don't fail the request if notification fails
}
```

### Step 4: Add notification logging after stats update

In `/app/api/projects/[id]/route.ts`, after line 98 (`const updatedProject = await collection.findOne({ _id: new ObjectId(id) });`), add:

```typescript
// WHAT: Log notification for stats update
// WHY: Notify users when project statistics are modified
try {
  const { getCurrentUser, createNotification } = await import('@/lib/notificationUtils');
  const user = await getCurrentUser();
  const db = client.db((await import('@/lib/config')).default.dbName);
  
  await createNotification(db, {
    activityType: 'edit-stats',
    user,
    projectId: id,
    projectName: existingProject.eventName || 'Unknown Project',
    projectSlug: existingProject.viewSlug || null
  });
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
  // Don't fail the request if notification fails
}
```

---

## 🧪 Testing the System

After completing the integration:

1. **Create a new project** - Check if a notification appears in the bell dropdown
2. **Edit a project** - Verify edit notification is logged
3. **Update project stats** - Confirm stats update notification appears
4. **Click on a notification** - Should navigate to the projects page and mark as read
5. **Verify badge count** - Red badge should show correct unread count
6. **Test "Mark all as read"** - Should clear all notifications and badge

---

## 📋 Database Schema

The notifications collection will be automatically created with this schema:

```typescript
{
  _id: ObjectId,
  activityType: 'create' | 'edit' | 'edit-stats',
  user: string,                  // User name from getCurrentUser()
  projectId: string,              // MongoDB ObjectId as string
  projectName: string,            // Event name
  projectSlug: string | null,     // View slug for linking
  timestamp: string,              // ISO 8601 with milliseconds
  read: boolean,                  // false for new notifications
  createdAt: string              // ISO 8601 with milliseconds
}
```

---

## 🎨 UI Features

- **Bell icon** in header with red badge showing unread count
- **Dropdown panel** with scrollable list of notifications
- **Real-time updates** - Badge refreshes every 30 seconds
- **Click to navigate** - Clicking a notification goes to projects page
- **Mark as read** - Individual or bulk "mark all as read"
- **Relative timestamps** - "2m ago", "3h ago", etc.
- **Activity icons** - ✨ create, ✏️ edit, 📊 stats update

---

## 🚀 Next Steps

1. Apply the code changes from Steps 1-4 above
2. Test all three notification types
3. Verify the full workflow end-to-end
4. Consider adding real-time WebSocket updates (optional enhancement)
5. Update documentation with the completed notification system

---

## 📝 Notes

- Notifications are logged **after** successful project operations
- Failed notification creation does NOT fail the main operation
- User identification uses the existing auth system (`getAdminUser`)
- Polling interval is 30 seconds (configurable in `TopHeader.tsx`)
- Notification panel is fully responsive for mobile devices
