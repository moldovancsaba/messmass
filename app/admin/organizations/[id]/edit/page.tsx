'use client';

import React, { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPut } from '@/lib/apiClient';
import OrganizationMembersSelector from '@/components/OrganizationMembersSelector';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import FormSection from '@/components/admin/FormSection';
import AdminEditorScaffold from '@/components/admin/AdminEditorScaffold';
import formStyles from '@/components/admin/WorkspaceFormFields.module.css';

interface PartnerMemberRow {
  _id: string;
  name: string;
  currentOrganizationId: string | null;
  currentOrganizationName: string;
  isMember: boolean;
}

export default function OrganizationEditPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const baseId = useId();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [orgType, setOrgType] = useState('federation');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [defaultSport, setDefaultSport] = useState('');
  const [defaultSeason, setDefaultSeason] = useState('2025/2026');
  const [logoUrl, setLogoUrl] = useState('');
  const [members, setMembers] = useState<PartnerMemberRow[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [orgRes, membersRes] = await Promise.all([
        fetch(`/api/organizations/${id}`, { cache: 'no-store' }),
        fetch(`/api/admin/organizations/${id}/members`, { cache: 'no-store' }),
      ]);
      const [orgData, membersData] = await Promise.all([
        orgRes.json().catch(() => null),
        membersRes.json().catch(() => null),
      ]);

      if (!orgData?.success || !orgData?.organization) {
        throw new Error(orgData?.error || 'Organization not found');
      }

      const o = orgData.organization;
      setName(o.name || '');
      setSlug(o.slug || '');
      setOrgType(o.orgType || 'federation');
      setStatus(o.status === 'inactive' ? 'inactive' : 'active');
      setDefaultSport(o.defaultSport || '');
      setDefaultSeason(o.defaultSeason || '2025/2026');
      setLogoUrl(o.logoUrl || '');

      if (membersData?.success && Array.isArray(membersData.partners)) {
        setMembers(membersData.partners);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user && id) {
      void loadData();
    }
  }, [authLoading, id, loadData, router, user]);

  const handleSelectedMembers = useCallback((selectedIds: string[]) => {
    const selectedSet = new Set(selectedIds);
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        isMember: selectedSet.has(m._id),
      }))
    );
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Organization Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const memberPartnerIds = members.filter((m) => m.isMember).map((m) => m._id);
      const res = await apiPut(`/api/organizations/${id}`, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        orgType,
        status,
        defaultSport: defaultSport.trim(),
        defaultSeason: defaultSeason.trim(),
        logoUrl: logoUrl.trim(),
        memberPartnerIds,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save organization');
      }
      setSuccessMessage('Organization settings and member clubs saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className={formStyles.loadingState}>Loading organization setup…</div>;
  }

  return (
    <AdminEditorScaffold
      tabs={
        <EntityWorkspaceTabs
          ariaLabel="Organization workspace navigation"
          backHref="/admin/organizations"
          backLabel="Organizations"
          tabs={[
            { label: 'Overview', href: `/admin/organizations/${id}`, icon: 'business' },
            { label: 'Setup & Members', href: `/admin/organizations/${id}/edit`, icon: 'settings' },
            { label: 'Reports & Variants', href: `/admin/organizations/${id}/reports`, icon: 'view_list' },
            { label: 'Classic Report', href: `/organization-report/${id}`, icon: 'bar_chart', external: true },
          ]}
        />
      }
      header={
        <WorkspaceHeader
          eyebrow="Organization Configuration"
          title={name || 'Edit Organization'}
          subtitle="Manage federation or sponsor identity, emblem logo, default competition metadata, and member club assignments."
          logoUrl={logoUrl || null}
          emoji="🏢"
          status={status}
        />
      }
      onSave={handleSave}
      onCancel={() => router.push(`/admin/organizations/${id}`)}
      isSaving={saving}
      disableSave={!name.trim()}
      error={error}
      successMessage={successMessage}
    >
      <FormSection
        title="Organization Identity"
        description="Name, canonical URL slug, entity classification, and status."
      >
        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-name`} className={formStyles.label}>
              Organization Name
            </label>
            <input
              id={`${baseId}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={formStyles.input}
              required
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-slug`} className={formStyles.label}>
              URL Slug (/interactive-report/organization/[slug])
            </label>
            <input
              id={`${baseId}-slug`}
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={formStyles.input}
            />
          </div>
        </div>

        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-type`} className={formStyles.label}>
              Organization Classification
            </label>
            <select
              id={`${baseId}-type`}
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              className={formStyles.select}
            >
              <option value="federation">Governing Federation</option>
              <option value="sponsor">Commercial Sponsor</option>
              <option value="league">International / Standalone League</option>
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-status`} className={formStyles.label}>
              Status
            </label>
            <select
              id={`${baseId}-status`}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className={formStyles.select}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Branding &amp; Competition Defaults"
        description="Official emblem URL (synced to Centralized Club Logos) and default sport/season metadata."
      >
        <div className={formStyles.gridThree}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-logo`} className={formStyles.label}>
              Official Logo URL (.svg / .png)
            </label>
            <input
              id={`${baseId}-logo`}
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className={formStyles.input}
            />
            <p className={formStyles.hint}>
              Manage emblems in{' '}
              <Link href="/admin/club-logos" className={formStyles.rowLink}>
                Centralized Club Logos
              </Link>
              .
            </p>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-sport`} className={formStyles.label}>
              Default Sport Discipline
            </label>
            <input
              id={`${baseId}-sport`}
              type="text"
              value={defaultSport}
              onChange={(e) => setDefaultSport(e.target.value)}
              placeholder="e.g. Football, Basketball, Handball"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-season`} className={formStyles.label}>
              Default Season
            </label>
            <input
              id={`${baseId}-season`}
              type="text"
              value={defaultSeason}
              onChange={(e) => setDefaultSeason(e.target.value)}
              placeholder="e.g. 2025/2026"
              className={formStyles.input}
            />
          </div>
        </div>
      </FormSection>

      {members.length > 0 && (
        <FormSection
          title="Member Clubs Management"
          description="Assign or remove partner clubs governed by this organization."
          badge={`${members.filter((m) => m.isMember).length} selected`}
        >
          <OrganizationMembersSelector
            members={members}
            onChange={handleSelectedMembers}
            disabled={saving}
            placeholder="Search partner clubs..."
          />
        </FormSection>
      )}
    </AdminEditorScaffold>
  );
}
