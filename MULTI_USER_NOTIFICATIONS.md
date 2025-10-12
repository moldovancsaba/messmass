# Multi-User Notification System (v5.48.0)

## 🎉 Overview

The notification system has been upgraded to support **multiple users** with independent read and archive status. All users see the same notifications, but each user can mark them as read or archive them independently.

---

## ✅ What's Implemented

### 1. **Shared Notifications for All Users**
- When someone creates/edits a project, **all users** see the notification
- No more single-user `read: boolean` - now uses arrays to track per-user state

### 2. **Independent Read/Archive Status**
Each user can:
- ✓ Mark notifications as read (adds their user ID to `readBy` array)
- ✗ Archive notifications to remove from their view (adds to `archivedBy` array)
- See their own unread count in the badge
- View only non-archived notifications by default

### 3. **New Notification Indicator**
- Animated pulsing dot (•) appears on badge when new notifications arrive
- Automatically detected by comparing unread count
- Pulses for 3 seconds then disappears
- Visual feedback for real-time activity

### 4. **Archive Functionality**
- Click the × button to archive any notification
- Archived notifications disappear from main view
- Archives don't affect other users
- Clicking archive also marks as read (decreases badge count)

---

## 📊 New Database Schema

```javascript
{
  _id: ObjectId("..."),
  activityType: "create" | "edit" | "edit-stats",
  user: "John Doe",                      // Who performed the action
  projectId: "507f191e810c19729de860ea",
  projectName: "Hungary vs Austria",
  projectSlug: "abc123xyz...",
  timestamp: "2025-10-12T13:00:55.123Z",
  
  // NEW: Multi-user arrays
  readBy: ["user-id-1", "user-id-3"],      // Users who read this
  archivedBy: ["user-id-2"],               // Users who archived this
  
  createdAt: "2025-10-12T13:00:55.123Z"
}
```

**Key Changes:**
- ❌ Removed: `read: boolean`
- ✅ Added: `readBy: string[]` - Array of user IDs
- ✅ Added: `archivedBy: string[]` - Array of user IDs

---

## 🔧 API Endpoints

### GET /api/notifications

**Query Parameters:**
- `limit=20` - Number of notifications to fetch
- `offset=0` - Pagination offset
- `excludeArchived=true` - Hide archived notifications (default behavior)
- `archivedOnly=true` - Show only archived notifications
- `unreadOnly=true` - Show only unread notifications

**Response:**
```json
{
  "success": true,
  "notifications": [...],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "totalCount": 45,
    "nextOffset": 20
  },
  "unreadCount": 12,
  "currentUserId": "user-id-1"
}
```

**Authentication:** Required - uses session cookie to identify user

---

### PUT /api/notifications/mark-read

**Request Body:**
```json
{
  "notificationIds": ["id1", "id2"],  // Optional: specific notifications
  "markAll": true,                     // Optional: mark all as read/archived
  "action": "read"                     // "read" or "archive"
}
```

**Response:**
```json
{
  "success": true,
  "action": "read",
  "modifiedCount": 5,
  "userId": "user-id-1"
}
```

**Actions:**
- `action: "read"` → Adds user ID to `readBy` array
- `action: "archive"` → Adds user ID to `archivedBy` array

**MongoDB Operations:**
Uses `$addToSet` to prevent duplicate user IDs in arrays.

---

## 🎨 UI Components

### NotificationPanel Features

1. **Header with Badge**
   - Shows unread count: `Notifications (3)`
   - Animated dot (•) pulses when new notifications arrive
   - "Mark all read" button for bulk action

2. **Notification Items**
   - Activity icon: ✨ create, ✏️ edit, 📊 stats
   - User name and action description
   - Project name
   - Relative timestamp: "2m ago", "3h ago"
   - Blue background if unread
   - Blue dot indicator if unread
   - Archive button (×) on hover

3. **Interactions**
   - **Click notification** → Marks as read + navigates to projects page
   - **Click × button** → Archives notification + removes from view
   - **Click "Mark all read"** → Marks all visible notifications as read

4. **Empty States**
   - "No notifications yet" when none exist
   - Loading spinner during fetch

---

## 💡 User Experience Flow

### Scenario: Team Member Creates a Project

1. **User A creates a project** → Notification logged
2. **User B** sees notification appear (bell badge shows `1`)
3. **User C** sees same notification (bell badge shows `1`)
4. **User B clicks notification** → Badge becomes `0` for User B only
5. **User C still sees badge `1`** → Independent read state
6. **User C clicks × to archive** → Notification disappears for User C
7. **User B still sees notification** → Independent archive state

### Badge Count Calculation

```
unreadCount = notifications where:
  - Current user ID NOT in readBy array
  - Current user ID NOT in archivedBy array
```

This means:
- Archived notifications don't contribute to unread count
- Each user sees their own personalized badge count

---

## 🧪 Testing the System

### Test Case 1: Multiple Users See Same Notification
1. Login as User A
2. Create a new project
3. Login as User B in different browser
4. Both users should see the notification

### Test Case 2: Independent Read Status
1. User A clicks notification → Badge clears for User A
2. User B still sees badge count
3. User B clicks notification → Badge clears for User B

### Test Case 3: Archive Functionality
1. User A clicks × on notification → Disappears for User A
2. User B still sees notification
3. User B can read or archive independently

### Test Case 4: New Notification Indicator
1. Wait for 30+ seconds (polling interval)
2. Create a new project in another tab
3. Badge should pulse with animated dot (•)
4. Dot disappears after 3 seconds

---

## 📝 Integration with Project Operations

To complete the system, add notification logging to project operations using the guide in `NOTIFICATION_INTEGRATION_GUIDE.md`.

**Quick Integration:**

```typescript
// After creating/editing a project
import { createNotification, getCurrentUser } from '@/lib/notificationUtils';

try {
  const user = await getCurrentUser();
  await createNotification(db, {
    activityType: 'create', // or 'edit' or 'edit-stats'
    user,
    projectId: result.insertedId.toString(),
    projectName: eventName,
    projectSlug: viewSlug
  });
} catch (error) {
  console.error('Failed to create notification:', error);
  // Don't fail the main operation
}
```

---

## 🔐 Security & Authentication

- All API endpoints require authentication
- Uses existing `getAdminUser()` from auth system
- User ID extracted from session cookie
- No user can see another user's read/archive choices
- MongoDB queries filter by current user ID automatically

---

## 🚀 Performance Considerations

### Database Indexes (Recommended)

```javascript
// For fast querying by read status
db.notifications.createIndex({ "readBy": 1 })

// For fast querying by archive status
db.notifications.createIndex({ "archivedBy": 1 })

// For sorting by timestamp
db.notifications.createIndex({ "timestamp": -1 })

// Compound index for unread count queries
db.notifications.createIndex({ "readBy": 1, "archivedBy": 1, "timestamp": -1 })
```

### Polling Strategy
- Current: 30-second intervals
- Configurable in `TopHeader.tsx` (line 32)
- Consider WebSocket for real-time updates (future enhancement)

---

## 🎯 Future Enhancements

1. **WebSocket Integration**
   - Push notifications instead of polling
   - Instant updates across all users

2. **Notification Preferences**
   - User can choose what to be notified about
   - Email notifications for important events

3. **Notification History**
   - Archived view to review past notifications
   - Search and filter capabilities

4. **Action Links**
   - Direct links to specific projects from notifications
   - Quick actions (e.g., "View Project", "Edit Stats")

5. **Bulk Operations**
   - Archive all read notifications
   - Delete notifications older than X days

---

## 📚 Related Files

- `/app/api/notifications/route.ts` - Main API endpoint
- `/app/api/notifications/mark-read/route.ts` - Read/archive endpoint
- `/components/NotificationPanel.tsx` - UI component
- `/components/NotificationPanel.module.css` - Styling
- `/components/TopHeader.tsx` - Bell icon integration
- `/lib/notificationUtils.ts` - Helper functions
- `NOTIFICATION_INTEGRATION_GUIDE.md` - Integration instructions

---

## 🐛 Troubleshooting

### Badge count not updating
- Check browser console for API errors
- Verify auth session is valid
- Ensure polling is running (30-second interval)

### Notifications not appearing
- Check MongoDB `notifications` collection exists
- Verify notification creation code is integrated
- Check API endpoint logs for errors

### Archive button not working
- Verify API call in browser network tab
- Check user ID is being sent correctly
- Confirm MongoDB update operation succeeds

---

## ✅ Summary

The multi-user notification system provides:
- ✓ Shared activity stream for all users
- ✓ Independent read/archive state per user
- ✓ Real-time new notification indicator
- ✓ Archive functionality to clean up notifications
- ✓ Scalable MongoDB schema with arrays
- ✓ Clean UX with badge counts and animations

**Status:** ✅ Ready for production use!
**Version:** 5.48.0
**Last Updated:** 2025-10-12
