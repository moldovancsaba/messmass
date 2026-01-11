# Multi-User Notifications
Status: Active
Last Updated: 2026-01-11T23:20:04.000Z
Canonical: Yes
Owner: Architecture

## System Overview and Data Flow
- `components/TopHeader.tsx` renders the notification bell and badge.
- `components/NotificationPanel.tsx` renders the dropdown panel and notification list.
- `TopHeader` polls `/api/notifications?limit=1` for unread counts.
- `NotificationPanel` loads `/api/notifications?limit=20&excludeArchived=true` when opened.
- Read and archive actions call `/api/notifications/mark-read` via `apiPut` (CSRF-aware).

## Notification Types and UI Behavior
- Activity types: `create`, `edit`, `edit-stats` (mapped to labels and icons in `NotificationPanel`).
- Badge: unread count displayed in `TopHeader` when `unreadCount > 0`.
- Panel actions: mark as read, mark all as read, archive a single notification.
- Navigation: clicking a notification routes to `/admin/events`.

## Delivery Cadence
- Unread count polling runs every 30 seconds while a user is present.
- Panel fetch runs on open to ensure fresh data.

## Performance Considerations
- Polling uses a low payload (`limit=1`) to minimize overhead.
- Panel fetch is limited to 20 items and excludes archived notifications.
- Avoid unnecessary panel opens to reduce request volume.

## Configuration and Permission Rules
- Notifications require an authenticated admin user (provided by `app/admin/layout.tsx`).
- Requests include credentials and rely on CSRF protection for write actions.
- API routes should enforce access control for admin users only.

## Troubleshooting and Known Failure Modes
- Badge not updating: verify `/api/notifications` responds with `success` and `unreadCount`.
- Panel not opening or closing: check click-outside handler in `NotificationPanel` and JS errors.
- Read or archive fails: verify `/api/notifications/mark-read` and CSRF token handling.
- Screen readers not announcing updates: no `aria-live` region is defined for the badge.
