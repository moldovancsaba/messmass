'use client';

// app/admin/organizations/page.tsx
// WHAT: Organization Management UI
// WHY: Create organizations and manage partner membership with the unified admin design system

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import ColoredCard from '@/components/ColoredCard';
import OrganizationMembersSelector from '@/components/OrganizationMembersSelector';
import { FormModal } from '@/components/modals';
import { apiDelete, apiPost, apiPut } from '@/lib/apiClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { organizationsAdapter } from '@/lib/adapters';

type Organization = {
  _id: string;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: {
    emoji?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
};

type PartnerRow = {
  _id: string;
  name: string;
  currentOrganizationId: string | null;
  currentOrganizationName: string;
  isMember: boolean;
};

export default function OrganizationsAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnersLoading, setPartnersLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editOrgId, setEditOrgId] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgStatus, setEditOrgStatus] = useState<'active' | 'inactive'>('active');

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/organizations', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load organizations');
      }
      setOrganizations(data.organizations || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  const openMembers = useCallback(async (org: Organization) => {
    setActiveOrg(org);
    setMembersModalOpen(true);
    setMembersError(null);
    setPartners([]);
    setPartnersLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org._id}/members`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load members');
      }
      setPartners(data.partners || []);
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  const setSelectedMembers = useCallback((memberIds: string[]) => {
    const selectedIdSet = new Set(memberIds);
    setPartners((prev) =>
      prev.map((partner) => ({ ...partner, isMember: selectedIdSet.has(partner._id) }))
    );
  }, []);

  const saveMembers = useCallback(async () => {
    if (!activeOrg) return;
    setSavingMembers(true);
    setMembersError(null);
    try {
      const memberPartnerIds = partners.filter((p) => p.isMember).map((p) => p._id);
      const data = await apiPut(`/api/admin/organizations/${activeOrg._id}/members`, { memberPartnerIds });
      if (!data.success) {
        throw new Error(data.error || 'Failed to save assignments');
      }
      setMembersModalOpen(false);
      setActiveOrg(null);
      await loadOrganizations();
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : 'Failed to save assignments');
    } finally {
      setSavingMembers(false);
    }
  }, [activeOrg, loadOrganizations, partners]);

  const deleteOrganization = useCallback(async (org: Organization) => {
    if (!confirm(`Delete organization "${org.name}"?`)) return;
    try {
      const data = await apiDelete(`/api/admin/organizations/${org._id}`);
      if (data.success === false) {
        throw new Error(data.error || 'Failed to delete organization');
      }
      await loadOrganizations();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete organization');
    }
  }, [loadOrganizations]);

  const createOrganization = useCallback(async () => {
    const name = newOrgName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const data = await apiPost('/api/admin/organizations', { name });
      if (!data.success) {
        throw new Error(data.error || 'Failed to create organization');
      }
      setCreateOpen(false);
      setNewOrgName('');
      await loadOrganizations();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  }, [loadOrganizations, newOrgName]);

  const openEditOrganization = useCallback((org: Organization) => {
    setEditOrgId(org._id);
    setEditOrgName(org.name);
    setEditOrgStatus(org.status || 'active');
    setEditOpen(true);
  }, []);

  const updateOrganization = useCallback(async () => {
    if (!editOrgId || !editOrgName.trim()) return;
    setEditing(true);
    setError(null);
    try {
      const data = await apiPut(`/api/admin/organizations/${editOrgId}`, {
        name: editOrgName.trim(),
        status: editOrgStatus,
      });
      if (!data.success) {
        throw new Error(data.error || 'Failed to update organization');
      }
      setEditOpen(false);
      setEditOrgId(null);
      await loadOrganizations();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update organization');
    } finally {
      setEditing(false);
    }
  }, [editOrgId, editOrgName, editOrgStatus, loadOrganizations]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user) {
      loadOrganizations();
    }
  }, [authLoading, loadOrganizations, router, user]);

  const organizationsAdapterWithHandlers = useMemo(() => {
    const mapAction = (label: string, org: Organization) => {
      if (label === 'Report') {
        return () => window.open(`/organization-report/${org._id}`, '_blank');
      }
      if (label === 'Edit Stats') {
        return () => window.open(`/organization-edit/${org._id}`, '_blank');
      }
      if (label === 'Edit') {
        return () => openEditOrganization(org);
      }
      if (label === 'Manage Members') {
        return () => openMembers(org);
      }
      if (label === 'Delete') {
        return () => deleteOrganization(org);
      }
      return () => {};
    };

    return {
      ...organizationsAdapter,
      listConfig: {
        ...organizationsAdapter.listConfig,
        rowActions: organizationsAdapter.listConfig.rowActions?.map((action) => ({
          ...action,
          handler: (org: Organization) => mapAction(action.label, org)(),
        })),
      },
      cardConfig: {
        ...organizationsAdapter.cardConfig,
        cardActions: organizationsAdapter.cardConfig.cardActions?.map((action) => ({
          ...action,
          handler: (org: Organization) => mapAction(action.label, org)(),
        })),
      },
    };
  }, [deleteOrganization, openEditOrganization, openMembers]);

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">Loading organizations…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <UnifiedAdminPage
        adapter={organizationsAdapterWithHandlers}
        items={organizations}
        isLoading={loading}
        title="🏢 Organization Management"
        subtitle="Create organizations, assign partner members, and open report/editor tools"
        backLink="/admin"
        actionButtons={[
          {
            label: 'Add Organization',
            onClick: () => setCreateOpen(true),
            variant: 'primary',
            icon: '+',
            title: 'Create a new organization',
          },
        ]}
        enableSearch
        enableSort
      />

      {error && (
        <ColoredCard accentColor="#ef4444" hoverable={false} className="mb-4">
          <div className="text-sm">{error}</div>
        </ColoredCard>
      )}

      <FormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createOrganization}
        title="+ Add Organization"
        submitText="Create"
        isSubmitting={creating}
        size="md"
      >
        <div className="form-group mb-2">
          <label className="form-label-block">Organization Name *</label>
          <input
            className="form-input"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="e.g., Champions Hockey League"
            autoFocus
          />
        </div>
      </FormModal>

      <FormModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditOrgId(null);
        }}
        onSubmit={updateOrganization}
        title="Edit Organization"
        submitText="Save Changes"
        isSubmitting={editing}
        size="md"
      >
        <div className="form-group mb-4">
          <label className="form-label-block">Organization Name *</label>
          <input
            className="form-input"
            value={editOrgName}
            onChange={(e) => setEditOrgName(e.target.value)}
            placeholder="Organization name"
            autoFocus
          />
        </div>
        <div className="form-group mb-2">
          <label className="form-label-block">Status</label>
          <select
            className="form-input"
            value={editOrgStatus}
            onChange={(e) => setEditOrgStatus(e.target.value as 'active' | 'inactive')}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </FormModal>

      <FormModal
        isOpen={membersModalOpen}
        onClose={() => {
          setMembersModalOpen(false);
          setActiveOrg(null);
          setPartners([]);
          setMembersError(null);
        }}
        onSubmit={saveMembers}
        title={activeOrg ? `Manage Members: ${activeOrg.name}` : 'Manage Members'}
        submitText="Save Assignments"
        isSubmitting={savingMembers}
        size="lg"
      >
        <p className="text-sm text-gray-600 mb-4">
          Select the members that belong to this organization. Changes are only applied when you save.
        </p>

        {membersError && <div className="text-sm text-red-600 mb-3">{membersError}</div>}

        {partnersLoading ? (
          <div className="text-sm text-gray-500 py-8 text-center">Loading members…</div>
        ) : partners.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">No members available for assignment.</div>
        ) : (
          <OrganizationMembersSelector
            members={partners}
            onChange={setSelectedMembers}
            disabled={savingMembers}
            placeholder="Search members..."
          />
        )}
      </FormModal>
    </>
  );
}
