'use client';

import React, { useState, useEffect } from 'react';
import ColoredCard from './ColoredCard';
import ReportContentManager from './ReportContentManager';
import { apiPut } from '@/lib/apiClient';

interface Organization {
  _id: string;
  name: string;
  slug: string;
  status: string;
  metadata?: {
    emoji?: string;
    logoUrl?: string;
    stats?: {
      [key: string]: string | undefined;
    };
    reportId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrganizationEditorDashboardProps {
  organization: Organization;
}

export default function OrganizationEditorDashboard({ organization: initialOrg }: OrganizationEditorDashboardProps) {
  const [org, setOrg] = useState<Organization>(initialOrg);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setOrg(initialOrg);
  }, [initialOrg]);

  const saveOrg = async (updatedStats?: any) => {
    setSaveStatus('saving');
    try {
      // WHAT: Update organization metadata via admin API
      // WHY: Persist report content changes (texts, images)
      const result = await apiPut(`/api/admin/organizations/${org._id}`, {
        metadata: {
          ...org.metadata,
          stats: updatedStats || org.metadata?.stats || {}
        }
      });

      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.error('Save failed:', result.error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save organization:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">
              {org.metadata?.emoji || '🏢'} {org.name}
            </h1>
            <p className="admin-subtitle">
              Organization Content Editor - Report Metadata
            </p>
          </div>
          <div className="admin-user-info">
            <div className="admin-badge p-3">
              <p className="admin-role">🔑 Superadmin Access</p>
              <p className="admin-level">Organization Level</p>
              <p className="admin-status">
                {saveStatus === 'saving' && '💾 Saving...'}
                {saveStatus === 'saved' && '✅ Saved'}
                {saveStatus === 'error' && '❌ Save Error'}
                {saveStatus === 'idle' && '📝 Ready'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <ColoredCard>
          <h2 className="section-title">📦 Organization Report Content</h2>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p><strong>ℹ️ Organization Level Content:</strong> This content appears on the root organization report. Use this to add high-level descriptions or aggregate branding that spans all sub-entities.</p>
          </div>
          
          <ReportContentManager
            stats={(org.metadata?.stats || {}) as any}
            onCommit={(newStats) => {
              setOrg(prev => ({ 
                ...prev, 
                metadata: { ...prev.metadata, stats: newStats as any } 
              }));
              saveOrg(newStats);
            }}
          />
        </ColoredCard>

        <ColoredCard>
          <h2 className="section-title">🏢 Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{org.metadata?.emoji || '🏢'}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-gray-600">Slug: {org.slug}</p>
                <p className="text-gray-600">ID: {org._id}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
              <p>Created: {new Date(org.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(org.updatedAt).toLocaleString()}</p>
              {org.metadata?.reportId && <p>Template ID: {org.metadata.reportId}</p>}
            </div>
          </div>
        </ColoredCard>
      </div>
    </div>
  );
}
