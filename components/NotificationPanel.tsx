'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './NotificationPanel.module.css';
import { apiPut } from '@/lib/apiClient';

/* WHAT: Notification panel component to display project activity notifications
 * WHY: Users need to see who created/edited projects and when, with links to the projects
 * 
 * Displays notifications in a dropdown panel below the bell icon
 * Shows time, user, activity type, and project name with link */

interface Notification {
  _id: string;
  activityType: 'create' | 'edit' | 'edit-stats';
  user: string;
  projectId: string;
  projectName: string;
  projectSlug?: string | null;
  timestamp: string;
  readBy: string[];        // Array of user IDs who have read this
  archivedBy: string[];    // Array of user IDs who have archived this
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // WHAT: Fetch notifications when panel opens
  // WHY: Load fresh data each time user clicks the bell
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // WHAT: Close panel when clicking outside
  // WHY: Standard UX pattern for dropdown panels
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

  // WHAT: Fetch notifications from API with exclude archived filter
  // WHY: Display recent activities in the panel, hide archived items
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=20&excludeArchived=true');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setCurrentUserId(data.currentUserId);
        
        // WHAT: Detect new notifications by comparing unread count
        // WHY: Show visual indicator when new notifications arrive
        if (data.unreadCount > previousUnreadCount && previousUnreadCount > 0) {
          setShowNewIndicator(true);
          setTimeout(() => setShowNewIndicator(false), 3000);
        }
        
        setPreviousUnreadCount(data.unreadCount);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // WHAT: Mark notification as read when clicked
  // WHY: Dismiss notifications and clear badge count
  // HOW: Use apiPut() for automatic CSRF token handling
  const markAsRead = async (notificationId: string) => {
    try {
      await apiPut('/api/notifications/mark-read', {
        notificationIds: [notificationId],
        action: 'read'
      });

      // Update local state - add current user to readBy array
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, readBy: [...n.readBy, currentUserId] } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // WHAT: Archive notification to remove from main list
  // WHY: Allow users to hide notifications they don't want to see anymore
  // HOW: Use apiPut() for automatic CSRF token handling
  const archiveNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click
    
    try {
      await apiPut('/api/notifications/mark-read', {
        notificationIds: [notificationId],
        action: 'archive'
      });

      // Remove from local state immediately
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Decrease unread count if it was unread
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.readBy.includes(currentUserId)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  // WHAT: Mark all notifications as read
  // WHY: Bulk action for clearing all notifications
  // HOW: Use apiPut() for automatic CSRF token handling
  const markAllAsRead = async () => {
    try {
      await apiPut('/api/notifications/mark-read', {
        markAll: true,
        action: 'read'
      });

      // Update local state - add current user to readBy arrays
      setNotifications(prev => prev.map(n => ({
        ...n,
        readBy: n.readBy.includes(currentUserId) ? n.readBy : [...n.readBy, currentUserId]
      })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // WHAT: Handle notification click - navigate to events page and mark as read
  // WHY: Allow users to view events details directly from notification
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readBy.includes(currentUserId)) {
      markAsRead(notification._id);
    }
    
    // Navigate to admin events page
    window.location.href = `/admin/events`;
  };

  // WHAT: Format timestamp to relative time
  // WHY: "2 minutes ago" is more user-friendly than ISO timestamp
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

  // WHAT: Get activity label and icon
  // WHY: Display meaningful activity descriptions
  const getActivityLabel = (activityType: string): { label: string; icon: string } => {
    switch (activityType) {
      case 'create':
        return { label: 'created project', icon: '✨' };
      case 'edit':
        return { label: 'edited project', icon: '✏️' };
      case 'edit-stats':
        return { label: 'updated stats', icon: '📊' };
      default:
        return { label: 'modified', icon: '🔄' };
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className={styles.notificationPanel}>
      {/* WHAT: Panel header with title and action buttons
         * WHY: Shows unread count and provides mark all as read action */}
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>
              {unreadCount}
              {showNewIndicator && <span className={styles.newIndicator}>•</span>}
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            className={styles.markAllButton}
            onClick={markAllAsRead}
            title="Mark all as read"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* WHAT: Notifications list
         * WHY: Display all recent activities */}
      <div className={styles.notificationsList}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔔</span>
            <p className={styles.emptyTitle}>No notifications yet</p>
            <p className={styles.emptyText}>
              Project activities will appear here
            </p>
          </div>
        ) : (
          notifications.map(notification => {
            const activity = getActivityLabel(notification.activityType);
            return (
              <div
                key={notification._id}
                className={`${styles.notificationItem} ${
                  !notification.readBy.includes(currentUserId) ? styles.unread : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationIcon}>{activity.icon}</div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationText}>
                    <strong>{notification.user}</strong> {activity.label}
                  </div>
                  <div className={styles.notificationProject}>
                    {notification.projectName}
                  </div>
                  <div className={styles.notificationTime}>
                    {formatTimestamp(notification.timestamp)}
                  </div>
                </div>
                <div className={styles.notificationActions}>
                  {!notification.readBy.includes(currentUserId) && (
                    <div className={styles.unreadDot}></div>
                  )}
                  <button
                    className={styles.archiveButton}
                    onClick={(e) => archiveNotification(notification._id, e)}
                    title="Archive notification"
                    aria-label="Archive"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
