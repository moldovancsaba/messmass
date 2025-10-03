'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './TopHeader.module.css';

/* What: Top header component for admin layout
   Why: Display user info, notifications placeholder, and logout
   
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
           Why: Quick access to user menu and logout */}
        <div className={styles.headerRight}>
          {/* What: Notifications placeholder
             Why: Future feature - can add notification bell icon */}
          <div className={styles.notificationsPlaceholder} title="Notifications (coming soon)">
            <span className={styles.notificationIcon}>🔔</span>
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
