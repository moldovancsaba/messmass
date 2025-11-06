'use client';

import React, { useEffect, useState } from 'react';
import { PageType } from '@/lib/pagePassword';
import styles from './PagePasswordLogin.module.css';

interface PagePasswordLoginProps {
  pageId: string;
  pageType: PageType;
  onSuccess: (isAdmin: boolean) => void;
  title?: string;
  description?: string;
}

export default function PagePasswordLogin({ 
  pageId, 
  pageType, 
  onSuccess, 
  title,
  description 
}: PagePasswordLoginProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What: Resolve and apply page-specific background variables for the overlay.
  // Why: Align password prompt visuals with the configured page style (Design Manager).
  useEffect(() => {
    let cancelled = false;
    const applyStyle = async () => {
      try {
        let bg: string | null = null;
        let header: string | null = null;

        if (pageType === 'event-report' || pageType === 'partner-report' || pageType === 'edit') {
          const qs = `?projectId=${encodeURIComponent(pageId)}`;
          const res = await fetch(`/api/page-config${qs}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.config?.pageStyle) {
              bg = `linear-gradient(${data.config.pageStyle.backgroundGradient})`;
              header = `linear-gradient(${data.config.pageStyle.headerBackgroundGradient})`;
            }
          }
        } else if (pageType === 'filter') {
          // Resolve style via filter slug -> styleId or hashtags
          const fRes = await fetch(`/api/hashtags/filter-by-slug/${encodeURIComponent(pageId)}`, { cache: 'no-store' });
          if (fRes.ok) {
            const fData = await fRes.json();
            let qs = '';
            if (fData?.styleId) qs = `?styleId=${encodeURIComponent(fData.styleId)}`;
            else if (Array.isArray(fData?.hashtags) && fData.hashtags.length > 0) qs = `?hashtags=${encodeURIComponent(fData.hashtags.join(','))}`;
            if (qs) {
              const pRes = await fetch(`/api/page-config${qs}`, { cache: 'no-store' });
              if (pRes.ok) {
                const pData = await pRes.json();
                if (pData?.success && pData?.config?.pageStyle) {
                  bg = `linear-gradient(${pData.config.pageStyle.backgroundGradient})`;
                  header = `linear-gradient(${pData.config.pageStyle.headerBackgroundGradient})`;
                }
              }
            }
          }
        }

        if (!cancelled) {
          const root = document.documentElement;
          if (bg) root.style.setProperty('--page-bg', bg);
          if (header) root.style.setProperty('--header-bg', header);
          // Apply content background if available
          try {
            // Attempt to fetch full page config to pull content background color
            const cfgRes = await fetch('/api/page-config' + (
              pageType === 'event-report' || pageType === 'partner-report' || pageType === 'edit' ? `?projectId=${encodeURIComponent(pageId)}` : ''
            ), { cache: 'no-store' });
            if (cfgRes.ok) {
              const cfgData = await cfgRes.json();
              const cbg = cfgData?.config?.pageStyle?.contentBackgroundColor;
              if (cbg) root.style.setProperty('--content-bg', cbg);
            }
          } catch {
            // ignore, fall back to default content surface
          }
        }
      } catch {
        // graceful fallback to defaults
      }
    };
    applyStyle();
    return () => { cancelled = true; };
  }, [pageId, pageType]);

  // Admin bypass: if a global admin session exists, skip this prompt entirely
  useEffect(() => {
    let cancelled = false
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/auth', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data?.user) {
            onSuccess(true)
          }
        }
      } catch {
        // ignore
      }
    }
    checkAdmin()
    return () => { cancelled = true }
  }, [onSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/page-passwords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageType,
          password: password.trim()
        })
      });

      const data = await response.json();

      if (data.success && data.isValid) {
        // Store authentication in session storage for this page
        const sessionKey = `auth_${pageType}_${pageId}`;
        sessionStorage.setItem(sessionKey, JSON.stringify({
          isAdmin: data.isAdmin,
          timestamp: Date.now(),
          password: data.isAdmin ? 'admin' : password.trim() // Don't store actual passwords
        }));

        onSuccess(data.isAdmin);
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to validate password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPageTypeDisplay = () => {
    switch (pageType) {
      case 'event-report':
        return 'Event Report';
      case 'partner-report':
        return 'Partner Report';
      case 'edit':
        return 'Editor';
      case 'filter':
        return 'Filter';
      default:
        return 'Page';
    }
  };

  const defaultTitle = title || `${getPageTypeDisplay()} Access Required`;
  const defaultDescription = description || `This ${getPageTypeDisplay().toLowerCase()} page is password protected. Please enter the admin password or the page-specific password to continue.`;

  return (
    <div className={`login-container ${styles.container}`}>
      <div className={styles.card}>
        <div className={styles.icon}>🔐</div>
        
        <h1 className={styles.title}>
          {defaultTitle}
        </h1>
        
        <p className={styles.description}>
          {defaultDescription}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              disabled={isLoading}
              className={styles.input}
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={styles.submitBtn}
          >
            {isLoading ? '🔄 Checking...' : '🔓 Access Page'}
          </button>
        </form>

        <div className={styles.hint}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>💡 Password Types:</p>
          <p style={{ margin: '0 0 0.25rem 0' }}>• <strong>Admin Password:</strong> Global access to all pages</p>
          <p style={{ margin: '0' }}>• <strong>Page Password:</strong> Access to this specific page only</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to check if user is authenticated for a specific page
export function isAuthenticated(pageId: string, pageType: PageType): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionKey = `auth_${pageType}_${pageId}`;
    const authData = sessionStorage.getItem(sessionKey);
    
    if (!authData) return false;
    
    const parsed = JSON.parse(authData);
    const now = Date.now();
    const sessionAge = now - parsed.timestamp;
    
    // Session expires after 24 hours for page passwords, 7 days for admin
    const maxAge = parsed.isAdmin ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    return sessionAge < maxAge;
  } catch {
    return false;
  }
}

// Helper function to clear authentication for a specific page
export function clearAuthentication(pageId: string, pageType: PageType): void {
  if (typeof window === 'undefined') return;
  
  const sessionKey = `auth_${pageType}_${pageId}`;
  sessionStorage.removeItem(sessionKey);
}
