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
import EntityFormModal from '@/components/admin/EntityFormModal';
import { apiDelete, apiPost, apiPut } from '@/lib/apiClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { organizationsAdapter, organizationsEntityConfig } from '@/lib/adapters';
import { withAdminEntityActions } from '@/lib/adminEntitySystem';

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
  const [createForm, setCreateForm] = useState({ name: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editOrgId, setEditOrgId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: 'active' });

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
    const name = createForm.name.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const data = await apiPost('/api/admin/organizations', { name });
      if (!data.success) {
        throw new Error(data.error || 'Failed to create organization');
      }
      setCreateOpen(false);
      setCreateForm({ name: '' });
      await loadOrganizations();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  }, [createForm.name, loadOrganizations]);

  const openEditOrganization = useCallback((org: Organization) => {
    setEditOrgId(org._id);
    setEditForm({ name: org.name, status: org.status || 'active' });
    setEditOpen(true);
  }, []);

  const updateOrganization = useCallback(async () => {
    if (!editOrgId || !editForm.name.trim()) return;
    setEditing(true);
    setError(null);
    try {
      const data = await apiPut(`/api/admin/organizations/${editOrgId}`, {
        name: editForm.name.trim(),
        status: editForm.status,
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
  }, [editForm.name, editForm.status, editOrgId, loadOrganizations]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user) {
      loadOrganizations();
    }
  }, [authLoading, loadOrganizations, router, user]);

  const organizationsAdapterWithHandlers = useMemo(() => withAdminEntityActions(
    organizationsAdapter,
    organizationsEntityConfig,
    {
      user,
      openModal: (modalKey, org) => {
        if (modalKey === 'edit-organization') {
          openEditOrganization(org);
          return;
        }

        if (modalKey === 'manage-members') {
          openMembers(org);
        }
      },
      runMutation: (mutationKey, org) => {
        if (mutationKey === 'delete-organization') {
          void deleteOrganization(org);
        }
      },
    }
  ), [deleteOrganization, openEditOrganization, openMembers, user]);

  const createOrganizationSchema = organizationsEntityConfig.forms?.find((form) => form.id === 'create-organization');
  const editOrganizationSchema = organizationsEntityConfig.forms?.find((form) => form.id === 'edit-organization');

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">Loading organizations…</div>
      </div>
    );
  }

  if (!user) return null;

  const canCreateOrganization = user.role === 'superadmin';

  return (
    <>
      <UnifiedAdminPage
        adapter={organizationsAdapterWithHandlers}
        items={organizations}
        isLoading={loading}
        title="🏢 Organization Management"
        subtitle="Create organizations, assign partner members, and open report/editor tools"
        backLink="/admin"
        actionButtons={canCreateOrganization ? [
          {
            label: 'Add Organization',
            onClick: () => setCreateOpen(true),
            variant: 'primary',
            icon: '+',
            title: 'Create a new organization',
          },
        ] : []}
        enableSearch
        enableSort
      />

      {error && (
        <ColoredCard accentColor="#ef4444" hoverable={false} className="mb-4">
          <div className="text-sm">{error}</div>
        </ColoredCard>
      )}

      {createOrganizationSchema && (
        <EntityFormModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={createOrganization}
          schema={createOrganizationSchema}
          values={createForm}
          onChange={(key, value) => setCreateForm((prev) => ({ ...prev, [key]: value }))}
          isSubmitting={creating}
          disableSubmit={!createForm.name.trim()}
        />
      )}

      {editOrganizationSchema && (
        <EntityFormModal
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditOrgId(null);
          }}
          onSubmit={updateOrganization}
          schema={editOrganizationSchema}
          values={editForm}
          onChange={(key, value) => setEditForm((prev) => ({ ...prev, [key]: value }))}
          isSubmitting={editing}
          disableSubmit={!editForm.name.trim()}
        />
      )}

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
