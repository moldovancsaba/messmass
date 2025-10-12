'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  
  /* What: Fetch unread notification count on mount and periodically
     Why: Display badge with current unread count */
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  
  /* What: Fetch unread notification count from API
     Why: Update badge without opening the panel */
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?limit=1');
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  /* What: Toggle notification panel visibility
     Why: Show/hide notifications on bell click */
  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    // Refresh count when opening panel
    if (!showNotifications) {
      fetchUnreadCount();
    }
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
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    }
  };
  
  return (
    <header className={styles.topHeader}>
      <div className={styles.headerContent}>
        {/* What: Left section placeholder
           Why: Can add search or quick actions later */}
        <div className={styles.headerLeft}>
          <span className={styles.welcomeText}>
            Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
          </span>
        </div>
        
        {/* What: Right section with user info and actions
           Why: Quick access to user menu, notifications, and logout */}
        <div className={styles.headerRight}>
          {/* What: Active notifications bell with badge and dropdown panel
             Why: Display project activity notifications in real-time */}
          <div className={styles.notificationsBell}>
            <button
              className={styles.notificationButton}
              onClick={handleBellClick}
              title="View notifications"
              aria-label="Notifications"
            >
              <span className={styles.notificationIcon}>🔔</span>
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              )}
            </button>
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
          
          {/* What: User info display
             Why: Show current user name, email, and role */}
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userRole}>{user.role}</div>
              </div>
            </div>
          )}
          
          {/* What: Logout button
             Why: Primary action to end session */}
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
            title="Logout"
          >
            <span className={styles.logoutIcon}>🚪</span>
            <span className={styles.logoutText}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
