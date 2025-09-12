'use client';

import React, { useEffect, useState } from 'react';
import { PageType } from '@/lib/pagePassword';

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

        if (pageType === 'stats' || pageType === 'edit') {
          const qs = `?projectId=${encodeURIComponent(pageId)}`;
          const res = await fetch(`/api/page-config${qs}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.config?.pageStyle) {
              bg = `linear-gradient(${data.config.pageStyle.backgroundGradient})`;
              header = `linear-gradient(${data.config.pageStyle.headerBackgroundGradient})`;
            }
          }
        } else if (pageType === 'filter') {
          // Resolve style via filter slug -> styleId or hashtags
          const fRes = await fetch(`/api/hashtags/filter-by-slug/${encodeURIComponent(pageId)}`);
          if (fRes.ok) {
            const fData = await fRes.json();
            let qs = '';
            if (fData?.styleId) qs = `?styleId=${encodeURIComponent(fData.styleId)}`;
            else if (Array.isArray(fData?.hashtags) && fData.hashtags.length > 0) qs = `?hashtags=${encodeURIComponent(fData.hashtags.join(','))}`;
            if (qs) {
              const pRes = await fetch(`/api/page-config${qs}`);
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
      case 'stats':
        return 'Statistics';
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
    <div className="login-container" style={{ 
      /* What: Use global login-container class which now respects --page-bg.
         Why: Ensures password overlay adopts Admin → Design page styles. */
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '16px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1.5rem'
        }}>🔐</div>
        
        <h1 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          {defaultTitle}
        </h1>
        
        <p style={{ 
          margin: '0 0 2rem 0', 
          opacity: 0.9,
          fontSize: '1.125rem',
          lineHeight: '1.6'
        }}>
          {defaultDescription}
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.125rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#fca5a5'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              background: isLoading || !password.trim() 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.9)',
              color: isLoading || !password.trim() ? 'rgba(255, 255, 255, 0.5)' : '#4f46e5',
              cursor: isLoading || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              if (!isLoading && password.trim()) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && password.trim()) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? '🔄 Checking...' : '🔓 Access Page'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          opacity: 0.8
        }}>
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
