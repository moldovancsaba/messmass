'use client';

import React from 'react';
import { AdminUser } from '@/lib/auth';

interface AdminDashboardProps {
  user: AdminUser;
  permissions: {
    canManageUsers: boolean;
    canDelete: boolean;
    canRead: boolean;
    canWrite: boolean;
  };
}

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  return (
    <div className="glass-card">
      {/* Navigation Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1rem',
        padding: '1rem 1rem'
      }}>

          <a
            href="/admin/projects"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>🍿</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Manage Projects</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Create, edit, delete, and organize all your events
              </div>
            </div>
          </a>

          <a
            href="/admin/filter"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>🔍</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Hashtag Filter</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Advanced hashtag filtering
              </div>
            </div>
          </a>

          <a
            href="/admin/hashtags"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(67, 233, 123, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 233, 123, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>🏷️</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Hashtag Manager</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Manage categories and colors
              </div>
            </div>
          </a>

          <a
            href="/admin/categories"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              color: '#8b4513',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(255, 236, 210, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 236, 210, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 236, 210, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>🌍</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Category Manager</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Manage categories and groupings
              </div>
            </div>
          </a>

          <a
            href="/admin/design"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 172, 254, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>🎨</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Design Manager</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Styles and Data visualization layouts
              </div>
            </div>
          </a>

          <a
            href="/admin/charts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(240, 147, 251, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>📈</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Algorithms</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Configure algorithms & processing
              </div>
            </div>
          </a>

          <a
            href="/admin/variables"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#4a5568',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(168, 237, 234, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 237, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 237, 234, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>⚙️</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Variable Manager</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Manage variables and configuration settings
              </div>
            </div>
          </a>

          <a
            href="/admin/visualization"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
              color: '#4a5568',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(210, 153, 194, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(210, 153, 194, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(210, 153, 194, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>🫠</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Visualization</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Data visualization blocks and layouts
              </div>
            </div>
          </a>

          {/* Users Management */}
          <a
            href="/admin/users"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>👤</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Users</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Create, regenerate, and delete admin users
              </div>
            </div>
          </a>
      </div>
    </div>
  );
}
