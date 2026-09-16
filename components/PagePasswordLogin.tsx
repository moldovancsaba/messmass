'use client';

import React, { useEffect, useState } from 'react';
import { PageType } from '@/lib/pagePassword';
import { isLightBackground, GATE_PALETTE } from '@/lib/theme/color';
import { DEFAULT_REPORT_STYLE_COLORS } from '@/lib/theme/reportStylePalette';
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
        // WHAT: Resolve the report's own background so the gate matches the page
        //   behind it, via the same chain the report itself uses:
        //   report-config -> styleId -> report-styles.
        // WHY: This previously called /api/page-config, a route that no longer
        //   exists. Guarded by `if (res.ok)`, the 404 failed silently and the
        //   gate simply never got a background (F-028). A second defect hid
        //   behind it: page-config returned a `linear-gradient(...)` string,
        //   which isLightBackground() cannot parse, so the light/dark choice
        //   below would always have fallen through to dark. The style's flat
        //   colour is what makes that decision work at all.
        const CONFIG_TYPE: Partial<Record<typeof pageType, 'project' | 'partner' | 'hashtag' | 'filter'>> = {
          'event-report': 'project', 'edit': 'project',
          'partner-report': 'partner', 'partner-edit': 'partner',
          'filter': 'filter', 'hashtag': 'hashtag',
        };

        // Default to the system style's own backdrop, so the gate is themed even
        // when the report has no style or points at a deleted one -- leaving it
        // unset is what produced the white-on-glass, 1.0:1 prompt.
        let bg: string = DEFAULT_REPORT_STYLE_COLORS.heroBackground;
        const configType = CONFIG_TYPE[pageType];

        if (configType) {
          const cfgRes = await fetch(
            `/api/report-config/${encodeURIComponent(pageId)}?type=${configType}`,
            { cache: 'no-store' }
          );
          if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            const styleId = cfg?.template?.styleId;
            if (styleId) {
              const sRes = await fetch(
                `/api/report-styles/${encodeURIComponent(String(styleId))}`,
                { cache: 'no-store' }
              );
              if (sRes.ok) {
                const s = await sRes.json();
                bg = s?.style?.pageBackground || s?.style?.heroBackground || bg;
              }
            }
          }
        }

        if (!cancelled) {
          const root = document.documentElement;
          root.style.setProperty('--page-bg', bg);
          // WHAT: Pick the gate's own palette from the background's luminance.
          // WHY: This card was authored white-on-glass, so on a light report
          //   background its text measured 1.04:1 contrast (1.00 on white) --
          //   an effectively invisible password prompt for the client.
          const palette = GATE_PALETTE[isLightBackground(bg) ? 'light' : 'dark'];
          for (const [key, value] of Object.entries(palette)) root.style.setProperty(key, value);
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
      case 'organization-edit':
        return 'Organization Editor';
      case 'filter':
        return 'Filter';
      default:
        return 'Page';
    }
  };

  const defaultTitle = title || `${getPageTypeDisplay()} Access Required`;
  const defaultDescription = description || `This ${getPageTypeDisplay().toLowerCase()} page is password protected. Please enter the page-specific password to continue, or use an authenticated admin session.`;

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
          <p className="m-0 mb-2 font-semibold">💡 Access Modes:</p>
          <p className="m-0 mb-1">• <strong>Admin Session:</strong> Signed-in admin access bypasses the prompt</p>
          <p className="m-0">• <strong>Page Password:</strong> Access to this specific page only</p>
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
