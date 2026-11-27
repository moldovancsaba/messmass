'use client';

import React, { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPut } from '@/lib/apiClient';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import FormSection from '@/components/admin/FormSection';
import AdminEditorScaffold from '@/components/admin/AdminEditorScaffold';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import formStyles from '@/components/admin/WorkspaceFormFields.module.css';

interface NamedOption {
  _id: string;
  name: string;
}

export default function PartnerEditPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const baseId = useId();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<NamedOption[]>([]);
  const [stylesList, setStylesList] = useState<NamedOption[]>([]);
  const [templatesList, setTemplatesList] = useState<NamedOption[]>([]);
  const [clickerSets, setClickerSets] = useState<NamedOption[]>([]);

  const [name, setName] = useState('');
  const [viewSlug, setViewSlug] = useState('');
  const [emoji, setEmoji] = useState('🏟️');
  const [showEmoji, setShowEmoji] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [logoUrl, setLogoUrl] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [styleId, setStyleId] = useState('');
  const [reportTemplateId, setReportTemplateId] = useState('');
  const [clickerSetId, setClickerSetId] = useState('');
  const [showEventsList, setShowEventsList] = useState(true);
  const [showOnlyTeam1Events, setShowOnlyTeam1Events] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [categorizedHashtags, setCategorizedHashtags] = useState<Record<string, string[]>>({});
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [partnerRes, orgsRes, stylesRes, tplRes, clickerRes] = await Promise.all([
        fetch(`/api/partners/${id}`, { cache: 'no-store' }),
        fetch('/api/admin/organizations', { cache: 'no-store' }),
        fetch('/api/report-styles', { cache: 'no-store' }),
        fetch('/api/report-templates?includeAssociations=false', { cache: 'no-store' }),
        fetch('/api/clicker-sets', { cache: 'no-store' }),
      ]);

      const [partnerData, orgsData, stylesData, tplData, clickerData] = await Promise.all([
        partnerRes.json().catch(() => null),
        orgsRes.json().catch(() => null),
        stylesRes.json().catch(() => null),
        tplRes.json().catch(() => null),
        clickerRes.json().catch(() => null),
      ]);

      if (!partnerData?.success || !partnerData?.partner) {
        throw new Error(partnerData?.error || 'Partner not found');
      }

      const p = partnerData.partner;
      setName(p.name || '');
      setViewSlug(p.viewSlug || '');
      setEmoji(p.emoji || '🏟️');
      setShowEmoji(p.showEmoji ?? true);
      setStatus(p.status === 'inactive' ? 'inactive' : 'active');
      setLogoUrl(p.logoUrl || '');
      setOrganizationId(p.organizationId || '');
      setStyleId(p.styleId || '');
      setReportTemplateId(p.reportTemplateId || '');
      setClickerSetId(p.clickerSetId || '');
      setShowEventsList(p.showEventsList ?? true);
      setShowOnlyTeam1Events(p.showOnlyTeam1Events ?? false);
      setHashtags(Array.isArray(p.hashtags) ? p.hashtags : []);
      setCategorizedHashtags(p.categorizedHashtags || {});
      setContactName(p.contactName || '');
      setContactEmail(p.contactEmail || '');
      setWebsiteUrl(p.websiteUrl || '');
      setGoogleSheetsUrl(p.googleSheetsUrl || '');

      if (orgsData?.success) setOrganizations(orgsData.organizations || []);
      if (Array.isArray(stylesData?.styles)) setStylesList(stylesData.styles);
      if (Array.isArray(tplData?.templates)) setTemplatesList(tplData.templates);
      if (Array.isArray(clickerData?.sets)) setClickerSets(clickerData.sets);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load partner settings');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user) {
      void loadData();
    }
  }, [authLoading, loadData, router, user]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Partner Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiPut(`/api/partners/${id}`, {
        name: name.trim(),
        viewSlug: viewSlug.trim() || undefined,
        emoji: emoji.trim() || '🏟️',
        showEmoji,
        status,
        logoUrl: logoUrl.trim(),
        organizationId: organizationId || null,
        styleId: styleId || null,
        reportTemplateId: reportTemplateId || null,
        clickerSetId: clickerSetId || null,
        showEventsList,
        showOnlyTeam1Events,
        hashtags,
        categorizedHashtags,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        websiteUrl: websiteUrl.trim(),
        googleSheetsUrl: googleSheetsUrl.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save partner');
      }
      setSuccessMessage('Partner settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className={formStyles.loadingState}>Loading partner setup…</div>;
  }

  return (
    <AdminEditorScaffold
      tabs={
        <EntityWorkspaceTabs
          ariaLabel="Partner workspace navigation"
          backHref="/admin/partners"
          backLabel="Partners"
          tabs={[
            { label: 'Overview', href: `/admin/partners/${id}`, icon: 'handshake' },
            { label: 'Setup & Edit', href: `/admin/partners/${id}/edit`, icon: 'settings' },
            { label: 'Reports & Variants', href: `/admin/partners/${id}/reports`, icon: 'view_list' },
            { label: 'Analytics', href: `/admin/partners/${id}/analytics`, icon: 'insert_chart' },
            { label: 'Metrics Table', href: `/admin/partners/${id}/kyc-data`, icon: 'table_chart' },
            { label: 'Lifecycle', href: `/admin/partners/${id}/lifecycle`, icon: 'history' },
          ]}
        />
      }
      header={
        <WorkspaceHeader
          eyebrow="Partner Configuration"
          title={name || 'Edit Partner'}
          subtitle="Manage official club identity, crest logo, governing federation, default report templates, and counter layouts."
          logoUrl={logoUrl || null}
          emoji={showEmoji ? emoji : undefined}
          status={status}
        />
      }
      onSave={handleSave}
      onCancel={() => router.push(`/admin/partners/${id}`)}
      isSaving={saving}
      disableSave={!name.trim()}
      error={error}
      successMessage={successMessage}
    >
      <FormSection
        title="Partner Identity"
        description="Club or partner display name, report URL slug, emoji badge, and operational status."
      >
        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-name`} className={formStyles.label}>
              Partner / Club Name
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
              Public Report Slug (/partner-report/[slug])
            </label>
            <input
              id={`${baseId}-slug`}
              type="text"
              value={viewSlug}
              onChange={(e) => setViewSlug(e.target.value)}
              className={formStyles.input}
            />
          </div>
        </div>

        <div className={formStyles.gridThree}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-emoji`} className={formStyles.label}>
              Emoji Icon
            </label>
            <input
              id={`${baseId}-emoji`}
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className={formStyles.input}
            />
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
          <div className={formStyles.fieldGroup}>
            <span className={formStyles.label}>Display Options</span>
            <label className={formStyles.checkboxRow}>
              <input
                type="checkbox"
                checked={showEmoji}
                onChange={(e) => setShowEmoji(e.target.checked)}
              />
              <span>Show emoji next to partner name</span>
            </label>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Brand Assets &amp; Governing Federation"
        description="Official vector crest URL (synced automatically to Centralized Club Logos) and primary federation membership."
      >
        <div className={formStyles.gridTwo}>
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
              Manage or upload verified vector crests in{' '}
              <Link href="/admin/club-logos" className={formStyles.rowLink}>
                Centralized Club Logos
              </Link>
              .
            </p>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-org`} className={formStyles.label}>
              Governing Federation / Organization
            </label>
            <select
              id={`${baseId}-org`}
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">None / Unassigned</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Style, Templates &amp; Live Counter Defaults"
        description="Inherited automatically by home events assigned to this club."
      >
        <div className={formStyles.gridThree}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-style`} className={formStyles.label}>
              Default Visual Theme
            </label>
            <select
              id={`${baseId}-style`}
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">System Default</option>
              {stylesList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-tpl`} className={formStyles.label}>
              Default Report Template
            </label>
            <select
              id={`${baseId}-tpl`}
              value={reportTemplateId}
              onChange={(e) => setReportTemplateId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">System Default</option>
              {templatesList.map((tpl) => (
                <option key={tpl._id} value={tpl._id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-clicker`} className={formStyles.label}>
              Live Counter Layout
            </label>
            <select
              id={`${baseId}-clicker`}
              value={clickerSetId}
              onChange={(e) => setClickerSetId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">Default Counter Layout</option>
              {clickerSets.map((cs) => (
                <option key={cs._id} value={cs._id}>
                  {cs.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={formStyles.gridTwo}>
          <label className={formStyles.checkboxRow}>
            <input
              type="checkbox"
              checked={showEventsList}
              onChange={(e) => setShowEventsList(e.target.checked)}
            />
            <span>Display related events table on partner reports</span>
          </label>
          <label className={formStyles.checkboxRow}>
            <input
              type="checkbox"
              checked={showOnlyTeam1Events}
              onChange={(e) => setShowOnlyTeam1Events(e.target.checked)}
            />
            <span>Include only Home (Partner 1) matches in partner reports</span>
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Hashtags"
        description="Default general and categorized hashtags associated with this partner."
      >
        <UnifiedHashtagInput
          generalHashtags={hashtags}
          onGeneralChange={setHashtags}
          categorizedHashtags={categorizedHashtags}
          onCategorizedChange={setCategorizedHashtags}
        />
      </FormSection>

      <FormSection
        title="Contact &amp; Google Sheets Reference"
        description="Optional stakeholder contact details and linked spreadsheet URL."
      >
        <div className={formStyles.gridThree}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-cname`} className={formStyles.label}>
              Contact Person
            </label>
            <input
              id={`${baseId}-cname`}
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-cemail`} className={formStyles.label}>
              Contact Email
            </label>
            <input
              id={`${baseId}-cemail`}
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-web`} className={formStyles.label}>
              Website URL
            </label>
            <input
              id={`${baseId}-web`}
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className={formStyles.input}
            />
          </div>
        </div>

        <div className={formStyles.fieldGroup}>
          <label htmlFor={`${baseId}-sheet`} className={formStyles.label}>
            Google Sheets URL
          </label>
          <input
            id={`${baseId}-sheet`}
            type="url"
            value={googleSheetsUrl}
            onChange={(e) => setGoogleSheetsUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className={formStyles.input}
          />
        </div>
      </FormSection>
    </AdminEditorScaffold>
  );
}
