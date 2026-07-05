'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NotificationPanel.module.css';
import { apiPut } from '@/lib/apiClient';

/* WHAT: Notification panel dropdown below the header bell.
 * WHY: Shows who created/edited projects and when, with deep links.
 *
 * The unread count is owned by TopHeader (single source of truth) and passed in;
 * this panel renders it and asks TopHeader to refresh it after every mutation so
 * the bell and panel can never drift (audit C3). */

interface Notification {
  _id: string;
  activityType: 'create' | 'edit' | 'edit-stats';
  user: string;
  projectId: string;
  projectName: string;
  projectSlug?: string | null;
  timestamp: string;
  readBy: string[];
  archivedBy: string[];
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /* Shared unread count owned by TopHeader (single source of truth with the bell). */
  unreadCount: number;
  /* Re-fetch the authoritative unread count after any read/archive/mark-all. */
  refreshUnreadCount: () => void;
}

const PAGE_SIZE = 20;

export default function NotificationPanel({ isOpen, onClose, unreadCount, refreshUnreadCount }: NotificationPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // WHAT: Close on outside click. WHY: standard dropdown UX.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // WHAT: Escape-to-close + move focus into the panel on open (a11y — audit M6).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // WHAT: Load a page of notifications; append when offset > 0 (audit H8).
  const load = useCallback(async (offset: number) => {
    const append = offset > 0;
    try {
      if (append) setLoadingMore(true);
      else { setLoading(true); setError(false); }

      const response = await fetch(
        `/api/notifications?limit=${PAGE_SIZE}&offset=${offset}&excludeArchived=true`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications);
        setCurrentUserId(data.currentUserId);
        setNextOffset(data.pagination?.nextOffset ?? null);
        // Sync the single shared unread count (bell + header).
        refreshUnreadCount();
      } else if (!append) {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (!append) setError(true);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [refreshUnreadCount]);

  // WHAT: Load fresh data each time the panel opens.
  useEffect(() => {
    if (isOpen) load(0);
  }, [isOpen, load]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiPut('/api/notifications/mark-read', { notificationIds: [notificationId], action: 'read' });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId
          ? { ...n, readBy: n.readBy.includes(currentUserId) ? n.readBy : [...n.readBy, currentUserId] }
          : n)
      );
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const archiveNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await apiPut('/api/notifications/mark-read', { notificationIds: [notificationId], action: 'archive' });
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      refreshUnreadCount();
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPut('/api/notifications/mark-read', { markAll: true, action: 'read' });
      setNotifications(prev => prev.map(n => ({
        ...n,
        readBy: n.readBy.includes(currentUserId) ? n.readBy : [...n.readBy, currentUserId]
      })));
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // WHAT: Navigate to the specific project and mark read (audit M4).
  // WHY: Previously always hard-navigated to /admin/events, discarding the
  //      notification's project identity and reloading the whole app.
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readBy.includes(currentUserId)) {
      markAsRead(notification._id);
    }
    onClose();
    router.push(notification.projectId ? `/admin/events/${notification.projectId}` : '/admin/events');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityLabel = (activityType: string): { label: string; icon: string } => {
    switch (activityType) {
      case 'create': return { label: 'created project', icon: '✨' };
      case 'edit': return { label: 'edited project', icon: '✏️' };
      case 'edit-stats': return { label: 'updated stats', icon: '📊' };
      default: return { label: 'modified', icon: '🔄' };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={styles.notificationPanel}
      role="dialog"
      aria-label="Notifications"
      tabIndex={-1}
    >
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button className={styles.markAllButton} onClick={markAllAsRead} title="Mark all as read">
            Mark all read
          </button>
        )}
      </div>

      <div className={styles.notificationsList}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">⚠️</span>
            <p className={styles.emptyTitle}>Couldn&apos;t load notifications</p>
            <button className={styles.markAllButton} onClick={() => load(0)}>Try again</button>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">🔔</span>
            <p className={styles.emptyTitle}>No notifications yet</p>
            <p className={styles.emptyText}>Project activities will appear here</p>
          </div>
        ) : (
          <>
            {notifications.map(notification => {
              const activity = getActivityLabel(notification.activityType);
              const isUnread = !notification.readBy.includes(currentUserId);
              return (
                <div
                  key={notification._id}
                  className={`${styles.notificationItem} ${isUnread ? styles.unread : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className={styles.notificationIcon} aria-hidden="true">{activity.icon}</div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationText} title={`${notification.user} ${activity.label}`}>
                      <strong>{notification.user}</strong> {activity.label}
                    </div>
                    <div className={styles.notificationProject} title={notification.projectName ?? undefined}>
                      {notification.projectName}
                    </div>
                    <div className={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                  <div className={styles.notificationActions}>
                    {isUnread && <div className={styles.unreadDot}></div>}
                    <button
                      className={styles.archiveButton}
                      onClick={(e) => archiveNotification(notification._id, e)}
                      title="Archive notification"
                      aria-label="Archive notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
            {nextOffset !== null && (
              <button
                className={styles.loadMoreButton}
                onClick={() => load(nextOffset)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
