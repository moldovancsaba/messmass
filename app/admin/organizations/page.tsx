'use client';

// app/admin/organizations/page.tsx
// WHAT: Organization Management UI
// WHY: Create organizations and assign member partners (one-org-per-partner)

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ColoredCard from '@/components/ColoredCard';
import { FormModal } from '@/components/modals';
import { apiDelete, apiPost, apiPut } from '@/lib/apiClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type Organization = {
  _id: string;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: {
    emoji?: string;
    [key: string]: unknown;
  };
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

  const selectedPartnerIds = useMemo(() => {
    return new Set(partners.filter((p) => p.isMember).map((p) => p._id));
  }, [partners]);

  const loadOrganizations = async () => {
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
  };

  const openMembers = async (org: Organization) => {
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
  };

  const togglePartner = (partnerId: string) => {
    setPartners((prev) =>
      prev.map((p) => (p._id === partnerId ? { ...p, isMember: !p.isMember } : p))
    );
  };

  const saveMembers = async () => {
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
  };

  const deleteOrganization = async (org: Organization) => {
    if (!confirm(`Delete organization "${org.name}"? Members will be unassigned.`)) return;
    try {
      const data = await apiDelete(`/api/admin/organizations/${org._id}`);
      if (data.success === false) {
        throw new Error(data.error || 'Failed to delete organization');
      }
      await loadOrganizations();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete organization');
    }
  };

  const createOrganization = async () => {
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
  };

  const openEditOrganization = (org: Organization) => {
    setEditOrgId(org._id);
    setEditOrgName(org.name);
    setEditOrgStatus(org.status || 'active');
    setEditOpen(true);
  };

  const updateOrganization = async () => {
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
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user) {
      loadOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">Loading organizations…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="🏢 Organization Management"
        subtitle="Create organizations and manage member partners (a partner can belong to only one organization)"
        backLink="/admin"
      />

      {error && (
        <ColoredCard accentColor="#ef4444" hoverable={false} className="mb-4">
          <div className="text-sm">{error}</div>
        </ColoredCard>
      )}

      <ColoredCard accentColor="#3b82f6" hoverable={false} className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
            <p className="text-sm text-gray-600">Create, delete, and manage memberships.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            + Add Organization
          </button>
        </div>
      </ColoredCard>

      <ColoredCard accentColor="#06b6d4" hoverable={false}>
        {organizations.length === 0 ? (
          <div className="text-gray-600">No organizations yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org._id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{org.metadata?.emoji || '🏢'}</span>
                        <span>{org.name}</span>
                      </div>
                    </td>
                    <td>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm text-blue-600 font-mono">
                        {org.slug}
                      </code>
                    </td>
                    <td>
                      <span className={org.status === 'inactive' ? 'text-red-600' : 'text-green-700'}>
                        {org.status || 'active'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => window.open(`/organization-report/${org._id}`, '_blank')}
                        >
                          Report
                        </button>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => window.open(`/organization-edit/${org._id}`, '_blank')}
                        >
                          Edit Stats
                        </button>
                        <button className="btn btn-small btn-secondary" onClick={() => openEditOrganization(org)}>
                          Edit
                        </button>
                        <button className="btn btn-small btn-secondary" onClick={() => openMembers(org)}>
                          Manage Members
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => deleteOrganization(org)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ColoredCard>

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
          Select the Partners that belong to this organization. Note: A partner can only belong to one organization.
        </p>

        {membersError && <div className="text-sm text-red-600 mb-3">{membersError}</div>}

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Partner Name</th>
                <th>Current Org</th>
              </tr>
            </thead>
            <tbody>
              {partnersLoading ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-8">
                    Loading partners…
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-8">
                    No partners available for assignment.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPartnerIds.has(p._id)}
                        onChange={() => togglePartner(p._id)}
                        disabled={savingMembers}
                      />
                    </td>
                    <td>{p.name}</td>
                    <td className="text-gray-600">{p.currentOrganizationName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FormModal>
    </div>
  );
}
