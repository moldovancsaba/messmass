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
    <div className="admin-container">
      {/* Hero Section with Navigation */}
      <div REPLACE_WITH_COLORED_CARD>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            MessMass Admin
          </h1>
          <p className="subtitle" style={{ fontSize: '1.25rem', color: '#6b7280' }}>
            Welcome back, {user.name}! Manage your projects and system settings.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <a
            href="/admin/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem' }}>📊</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Dashboard</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Dashboard Overview, Success Manager, Statistics & Multi-Hashtag Filter
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
            <div style={{ fontSize: '2rem' }}>📊</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Chart Algorithm Manager</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Configure chart algorithms, data processing & visualization settings
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
                Manage page styles and data visualization layouts
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
                Manage hashtag categories and individual hashtag colors
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Project Management Section */}
      <div REPLACE_WITH_COLORED_CARD>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 className="section-title">📊 Project Management</h2>
          <a 
            href="/admin/projects"
            className="btn btn-primary"
            title="Manage all projects - create, edit, delete, and organize"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            📊 Manage Projects
          </a>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ color: '#1f2937', marginBottom: '1rem', fontSize: '1.5rem' }}>
            Project Management Hub
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Create, edit, and manage all your event projects in one place. Each project includes comprehensive statistics tracking, hashtag categorization, and detailed analytics.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Create Projects</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Add new events with hashtags</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✏️</div>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Edit & Update</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Modify project details</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Search & Filter</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Find projects by any criteria</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>View Statistics</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Access detailed analytics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div REPLACE_WITH_COLORED_CARD>
        <h2 className="section-title">Quick Access</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <div style={{ fontWeight: '600', color: '#059669', marginBottom: '0.25rem' }}>Success Metrics</div>
            <div style={{ fontSize: '0.875rem', color: '#374151' }}>Track engagement and performance</div>
          </div>
          
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontWeight: '600', color: '#2563eb', marginBottom: '0.25rem' }}>Data Visualization</div>
            <div style={{ fontSize: '0.875rem', color: '#374151' }}>Beautiful charts and analytics</div>
          </div>
          
          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷️</div>
            <div style={{ fontWeight: '600', color: '#7c3aed', marginBottom: '0.25rem' }}>Smart Tagging</div>
            <div style={{ fontSize: '0.875rem', color: '#374151' }}>Categorize with hashtags</div>
          </div>
        </div>
      </div>
    </div>
  );
}
