'use client';

/**
 * Organization Management Page
 * WHAT: Admin UI for managing root-level organizations
 * WHY: Anchor for the V3 multi-tenant hierarchy
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { organizationsAdapter } from '@/lib/adapters';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import FormModal from '@/components/modals/FormModal';
import UnifiedTextInput from '@/components/UnifiedTextInput';
import { apiPost, apiPatch, apiDelete } from '@/lib/apiClient';

import ManageMembersModal from '@/components/ManageMembersModal';
import EmojiSelector from '@/components/EmojiSelector';

interface ConfigOption {
  _id: string;
  name: string;
}

export default function OrganizationsAdminPage() {
  const { user, loading: authLoading } = useAdminAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  
  // Settings options
  const [availableStyles, setAvailableStyles] = useState<ConfigOption[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<ConfigOption[]>([]);
  const [availableClickerSets, setAvailableClickerSets] = useState<ConfigOption[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'active',
    metadata: {
      emoji: '',
      showEmoji: true,
      styleId: '',
      reportTemplateId: '',
      clickerSetId: '',
      logoUrl: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations);
      } else {
        setError(data.error || 'Failed to load organizations');
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError('Network error loading organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      loadOrganizations();
      
      // Load config options (parity with Partners)
      const fetchConfig = async (url: string, setter: (data: any) => void) => {
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            if (data.styles) setter(data.styles);
            else if (data.templates) setter(data.templates);
            else if (data.sets) setter(data.sets);
          }
        } catch (err) {
          console.error(`Failed to fetch ${url}:`, err);
        }
      };

      fetchConfig('/api/report-styles', setAvailableStyles);
      fetchConfig('/api/report-templates?includeAssociations=false', setAvailableTemplates);
      fetchConfig('/api/clicker-sets', setAvailableClickerSets);
    }
  }, [user, loadOrganizations]);

  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      setError('Name and slug are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await apiPost('/api/admin/organizations', formData);
      if (data.success) {
        setSuccessMessage(`Organization "${formData.name}" created successfully`);
        setShowAddForm(false);
        setFormData({ 
          name: '', 
          slug: '', 
          status: 'active',
          metadata: {
            emoji: '',
            showEmoji: true,
            styleId: '',
            reportTemplateId: '',
            clickerSetId: '',
            logoUrl: ''
          }
        });
        loadOrganizations();
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('Network error creating organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingOrg) return;

    try {
      setIsSubmitting(true);
      const data = await apiPatch(`/api/admin/organizations/${editingOrg._id}`, formData);
      if (data.success) {
        setSuccessMessage(`Organization "${formData.name}" updated successfully`);
        setShowEditForm(false);
        setEditingOrg(null);
        setFormData({ 
          name: '', 
          slug: '', 
          status: 'active',
          metadata: {
            emoji: '',
            showEmoji: true,
            styleId: '',
            reportTemplateId: '',
            clickerSetId: '',
            logoUrl: ''
          }
        });
        loadOrganizations();
      } else {
        setError(data.error || 'Failed to update organization');
      }
    } catch (err) {
      setError('Network error updating organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (org: any) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This will break children entities.`)) {
      return;
    }

    try {
      const data = await apiDelete(`/api/admin/organizations/${org._id}`);
      if (data.success) {
        setSuccessMessage(`Organization "${org.name}" deleted`);
        loadOrganizations();
      } else {
        setError(data.error || 'Failed to delete organization');
      }
    } catch (err) {
      setError('Network error deleting organization');
    }
  }, [loadOrganizations]);

  const openEdit = useCallback((org: any) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      status: org.status || 'active',
      metadata: {
        emoji: org.metadata?.emoji || '',
        showEmoji: org.metadata?.showEmoji !== false,
        styleId: org.metadata?.styleId || '',
        reportTemplateId: org.metadata?.reportTemplateId || '',
        clickerSetId: org.metadata?.clickerSetId || '',
        logoUrl: org.metadata?.logoUrl || ''
      }
    });
    setShowEditForm(true);
  }, []);

  const openMembers = useCallback((org: any) => {
    setEditingOrg(org);
    setShowMembersModal(true);
  }, []);

  const adapterWithHandlers = useMemo(() => ({
    ...organizationsAdapter,
    listConfig: {
      ...organizationsAdapter.listConfig,
      rowActions: organizationsAdapter.listConfig.rowActions?.map(action => {
        if (action.label === 'Edit') return { ...action, handler: openEdit };
        if (action.label === 'Delete') return { ...action, handler: handleDelete };
        if (action.label === 'Members') return { ...action, handler: openMembers };
        return action;
      })
    },
    cardConfig: {
      ...organizationsAdapter.cardConfig,
      cardActions: organizationsAdapter.cardConfig.cardActions?.map(action => {
        if (action.label === 'Edit') return { ...action, handler: openEdit };
        if (action.label === 'Delete') return { ...action, handler: handleDelete };
        if (action.label === 'Members') return { ...action, handler: openMembers };
        return action;
      })
    }
  }), [handleDelete, openEdit, openMembers]);

  if (authLoading || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600">You must be a superadmin to manage organizations.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <UnifiedAdminPage
        adapter={adapterWithHandlers}
        items={organizations}
        isLoading={loading}
        title="🏢 Organization Management"
        subtitle="Manage root-level entities for V3 multi-tenant hierarchy"
        actionButtons={[
          {
            label: 'Add Organization',
            onClick: () => setShowAddForm(true),
            variant: 'primary',
            icon: '+'
          }
        ]}
      />

      {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      {successMessage && <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg">{successMessage}</div>}

      {/* Create Modal */}
      <FormModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreate}
        title="Create Organization"
        submitText="Create"
        isSubmitting={isSubmitting}
      >
        <UnifiedTextInput
          label="Name"
          value={formData.name}
          onSave={(val) => setFormData({ ...formData, name: val })}
          placeholder="e.g. Acme Corp"
          required={true}
        />
        <UnifiedTextInput
          label="Slug"
          value={formData.slug}
          onSave={(val) => setFormData({ ...formData, slug: val.toLowerCase().replace(/\s+/g, '-') })}
          placeholder="e.g. acme-corp"
          required={true}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdate}
        title="Edit Organization"
        submitText="Save Changes"
        isSubmitting={isSubmitting}
      >
        <UnifiedTextInput
          label="Name"
          value={formData.name}
          onSave={(val) => setFormData({ ...formData, name: val })}
          required={true}
        />
        <UnifiedTextInput
          label="Slug"
          value={formData.slug}
          onSave={(val) => setFormData({ ...formData, slug: val.toLowerCase().replace(/\s+/g, '-') })}
          required={true}
        />
        <div className="form-group">
          <label className="form-label-block">Status</label>
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group mt-6">
          <label className="form-label-block">Organization Branding</label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="form-label-block text-xs uppercase text-gray-500 mb-2">Emoji & Identity</label>
            <EmojiSelector
              value={formData.metadata.emoji}
              onChange={(emoji) => setFormData({ 
                ...formData, 
                metadata: { ...formData.metadata, emoji } 
              })}
            />
            <div className="mt-4">
              <UnifiedTextInput
                label="Logo URL"
                value={formData.metadata.logoUrl}
                onSave={(val) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, logoUrl: val } 
                })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.metadata.showEmoji}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, showEmoji: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Display emoji on reports</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-group mt-6">
          <label className="form-label-block">Global Reporting Setup</label>
          <div className="space-y-4">
            <div>
              <label className="form-label-block text-xs uppercase text-gray-500 mb-1">Visual Style</label>
              <select
                className="form-input"
                value={formData.metadata.styleId}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, styleId: e.target.value }
                })}
              >
                <option value="">Default System Style</option>
                {availableStyles.map(style => (
                  <option key={style._id} value={style._id}>{style.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label-block text-xs uppercase text-gray-500 mb-1">Report Template</label>
              <select
                className="form-input"
                value={formData.metadata.reportTemplateId}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, reportTemplateId: e.target.value }
                })}
              >
                <option value="">Default Global Template</option>
                {availableTemplates.map(tpl => (
                  <option key={tpl._id} value={tpl._id}>{tpl.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label-block text-xs uppercase text-gray-500 mb-1">Clicker Set</label>
              <select
                className="form-input"
                value={formData.metadata.clickerSetId}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, clickerSetId: e.target.value }
                })}
              >
                <option value="">Default Metrics Set</option>
                {availableClickerSets.map(set => (
                  <option key={set._id} value={set._id}>{set.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Manage Members Modal */}
      <ManageMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        organization={editingOrg}
      />
    </div>
  );
}
