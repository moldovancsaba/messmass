// app/admin/unauthorized/page.tsx
// WHAT: Unauthorized access page shown when user lacks required permissions
// WHY: Provide clear feedback about insufficient role/permissions
// HOW: Display required vs current role, link to help page and contact info

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import type { UserRole } from '@/lib/users';
import { getRoleDisplayName } from '@/lib/permissions';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  // WHAT: Fetch current user role for context
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role) {
            setCurrentUserRole(data.user.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRole();
  }, []);
  
  const attemptedPath = searchParams?.get('path') || 'this page';
  
  return (
    <div className="app-container">
      <ColoredCard accentColor="#ef4444" hoverable={false} className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-container">
            <span style={{ fontSize: '3rem' }}>🚫</span> {/* eslint-disable-line react/forbid-dom-props */}
          </div>
          <h1 className="title login-title">
            Access Denied
          </h1>
          <p className="subtitle login-subtitle">
            You don't have sufficient permissions to access {attemptedPath}
          </p>
        </div>

        {/* Permission Details */}
        {!loading && currentUserRole && (
          <div style={{ // eslint-disable-line react/forbid-dom-props
            padding: '1.5rem',
            backgroundColor: 'var(--mm-gray-50)',
            borderRadius: 'var(--mm-radius-md)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ // eslint-disable-line react/forbid-dom-props
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}>
              <span style={{ // eslint-disable-line react/forbid-dom-props
                fontSize: '1.25rem',
                color: 'var(--mm-gray-600)',
              }}>
                ℹ️
              </span>
              <strong style={{ color: 'var(--mm-gray-900)' }}> {/* eslint-disable-line react/forbid-dom-props */}
                Your Current Role:
              </strong>
              <span style={{ // eslint-disable-line react/forbid-dom-props
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: getRoleBadgeColor(currentUserRole),
                color: 'var(--mm-white)',
              }}>
                {getRoleDisplayName(currentUserRole)}
              </span>
            </div>
            
            <p style={{ // eslint-disable-line react/forbid-dom-props
              fontSize: 'var(--mm-font-size-sm)',
              color: 'var(--mm-gray-600)',
              marginBottom: 0,
            }}>
              This page requires higher permissions. Contact a superadmin to request access.
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ // eslint-disable-line react/forbid-dom-props
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <button
            type="button"
            onClick={() => router.push('/admin/help')}
            className="btn btn-primary w-full"
          >
            📚 Go to User Guide
          </button>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary w-full"
          >
            ← Go Back
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            Need elevated permissions?<br />
            Contact your MessMass administrator to upgrade your role.
          </p>
        </div>
      </ColoredCard>
    </div>
  );
}

/**
 * WHAT: Get role badge background color
 * WHY: Visual consistency with role badges
 */
function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    guest: '#9ca3af',      // Gray
    user: '#3b82f6',       // Blue
    admin: '#10b981',      // Green
    superadmin: '#8b5cf6', // Purple
  };
  return colors[role] || '#6b7280';
}
