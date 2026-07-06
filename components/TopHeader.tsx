'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Avatar, Badge, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconBell, IconDoorExit } from '@tabler/icons-react';
import NotificationPanel from './NotificationPanel';
import styles from './TopHeader.module.css';

/* What: Top header component for admin layout
   Why: Display user info, active notifications system, and logout
   
   No breadcrumbs (explicitly prohibited by policy) */

interface TopHeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function TopHeader({ user }: TopHeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef<number | null>(null);

  /* What: Fetch unread notification count from API — the single source of truth
     Why: Both the bell badge and the notification panel header read THIS value.
          Stable identity (useCallback) so the panel can call it after mutations
          without re-triggering render loops. */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=1', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  /* What: Fetch unread notification count on mount and periodically
     Why: Display badge with current unread count */
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  /* OPS-ADMIN-01: Announce badge updates to screen readers (aria-live) */
  useEffect(() => {
    if (prevUnreadRef.current !== null && prevUnreadRef.current !== unreadCount) {
      const liveEl = document.getElementById('notifications-live');
      if (liveEl) {
        liveEl.textContent = unreadCount === 0
          ? 'No unread notifications'
          : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`;
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  /* What: Toggle notification panel visibility
     Why: Show/hide notifications on bell click
     Note: functional update avoids a stale-closure race with the panel's
           outside-click handler when the bell is clicked while open (audit L6). */
  const handleBellClick = () => {
    setShowNotifications(prev => {
      if (!prev) fetchUnreadCount(); // refresh count when opening
      return !prev;
    });
  };
  
  /* What: Handle logout action
     Why: Clear session and redirect to login */
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/admin/login');
      } else {
        window.alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.alert('Logout failed. Please try again.');
    }
  };
  
  return (
    <header className={styles.topHeader}>
      <Group className={styles.headerContent} justify="space-between" gap="md" wrap="nowrap">
        <Box className={styles.headerLeft}>
          <Text className={styles.welcomeText} fw={500}>
            Welcome back{user?.name ? `, ${user.name}` : ''}! <span aria-hidden="true">👋</span>
          </Text>
        </Box>
        
        <Group className={styles.headerRight} gap="md" justify="flex-end" wrap="wrap">
          <div className={styles.notificationsBell}>
            <span
              id="notifications-live"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            />
            <div
              className={styles.notificationButton}
            >
              <ActionIcon
                variant="default"
                size="lg"
                radius="md"
                color="gray"
                onClick={handleBellClick}
                title="View notifications"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              >
                <IconBell size={18} stroke={1.8} />
              </ActionIcon>
              {unreadCount > 0 && (
                <Badge className={styles.notificationBadge} size="sm" circle>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              unreadCount={unreadCount}
              refreshUnreadCount={fetchUnreadCount}
            />
          </div>
          
          {user && (
            <Paper withBorder radius="md" className={styles.userInfo} p="xs">
              <Group gap="sm" wrap="nowrap">
                <Avatar color="blue" radius="xl" className={styles.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Stack gap={2} className={styles.userDetails}>
                  <Text className={styles.userName} fw={600} size="sm">
                    {user.name}
                  </Text>
                  <Text className={styles.userRole} size="xs">
                    {user.role}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          )}
          
          <Button
            variant="default"
            leftSection={<IconDoorExit size={16} stroke={1.8} />}
            className={styles.logoutButton}
            onClick={handleLogout}
            title="Logout"
          >
            <span className={styles.logoutText}>Logout</span>
          </Button>
        </Group>
      </Group>
    </header>
  );
}
