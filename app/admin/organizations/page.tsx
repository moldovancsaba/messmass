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
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'active'
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
        setFormData({ name: '', slug: '', status: 'active' });
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
        setFormData({ name: '', slug: '', status: 'active' });
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

  const handleDelete = async (org: any) => {
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
  };

  const openEdit = (org: any) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      status: org.status || 'active'
    });
    setShowEditForm(true);
  };

  const openMembers = (org: any) => {
    setEditingOrg(org);
    setShowMembersModal(true);
  };

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
