'use client';

import React, { useCallback, useEffect, useId, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPut } from '@/lib/apiClient';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import FormSection from '@/components/admin/FormSection';
import AdminEditorScaffold from '@/components/admin/AdminEditorScaffold';
import PartnerSelector from '@/components/PartnerSelector';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import formStyles from '@/components/admin/WorkspaceFormFields.module.css';

interface PartnerOption {
  _id: string;
  name: string;
  emoji?: string;
  showEmoji?: boolean;
  logoUrl?: string | null;
}

interface OrgOption {
  _id: string;
  name: string;
  slug: string;
}

interface NamedOption {
  _id: string;
  name: string;
}

export default function EventEditPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const baseId = useId();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [stylesList, setStylesList] = useState<NamedOption[]>([]);
  const [templatesList, setTemplatesList] = useState<NamedOption[]>([]);

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [viewSlug, setViewSlug] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [partner1Id, setPartner1Id] = useState<string | null>(null);
  const [partner2Id, setPartner2Id] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [competitionType, setCompetitionType] = useState<string>('');
  const [sport, setSport] = useState('football');
  const [format, setFormat] = useState('league');
  const [division, setDivision] = useState('men');
  const [tierLabel, setTierLabel] = useState('');
  const [sponsorTitle, setSponsorTitle] = useState('');
  const [season, setSeason] = useState('2025/2026');
  const [styleId, setStyleId] = useState('');
  const [reportTemplateId, setReportTemplateId] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [categorizedHashtags, setCategorizedHashtags] = useState<Record<string, string[]>>({});
  const [cameraEventId, setCameraEventId] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projRes, partnersRes, orgsRes, stylesRes, tplRes] = await Promise.all([
        fetch(`/api/projects/${id}`, { cache: 'no-store' }),
        fetch('/api/admin/partners', { cache: 'no-store' }),
        fetch('/api/admin/organizations', { cache: 'no-store' }),
        fetch('/api/report-styles', { cache: 'no-store' }),
        fetch('/api/report-templates?includeAssociations=false', { cache: 'no-store' }),
      ]);

      const [projData, partnersData, orgsData, stylesData, tplData] = await Promise.all([
        projRes.json().catch(() => null),
        partnersRes.json().catch(() => null),
        orgsRes.json().catch(() => null),
        stylesRes.json().catch(() => null),
        tplRes.json().catch(() => null),
      ]);

      if (!projData?.success || !projData?.project) {
        throw new Error(projData?.error || 'Event not found');
      }

      const p = projData.project;
      setEventName(p.eventName || '');
      setEventDate(p.eventDate ? String(p.eventDate).slice(0, 10) : '');
      setLocation(p.location || '');
      setDescription(p.description || '');
      setViewSlug(p.viewSlug || '');
      setEditSlug(p.editSlug || '');
      setPartner1Id(
        p.partner1Id ? String(p.partner1Id) : p.partner1?._id ? String(p.partner1._id) : null
      );
      setPartner2Id(
        p.partner2Id ? String(p.partner2Id) : p.partner2?._id ? String(p.partner2._id) : null
      );
      setOrganizationId(p.organizationId ? String(p.organizationId) : '');
      setOrganizationIds(
        Array.isArray(p.organizationIds) ? p.organizationIds.map((oid: unknown) => String(oid)) : []
      );
      setCompetitionType(p.competitionType || '');
      if (p.competition && typeof p.competition === 'object') {
        setSport(p.competition.sport || 'football');
        setFormat(p.competition.format || 'league');
        setDivision(p.competition.division || 'men');
        setTierLabel(p.competition.tierLabel || '');
        setSponsorTitle(p.competition.sponsorTitle || '');
        setSeason(p.competition.season || '2025/2026');
      }
      setStyleId(p.styleId ? String(p.styleId) : '');
      setReportTemplateId(p.reportTemplateId ? String(p.reportTemplateId) : '');
      setHashtags(Array.isArray(p.hashtags) ? p.hashtags : []);
      setCategorizedHashtags(p.categorizedHashtags || {});
      setCameraEventId(p.externalRefs?.camera?.eventId || '');

      if (partnersData?.success) setPartners(partnersData.partners || []);
      if (orgsData?.success) setOrganizations(orgsData.organizations || []);
      if (Array.isArray(stylesData?.styles)) setStylesList(stylesData.styles);
      if (Array.isArray(tplData?.templates)) setTemplatesList(tplData.templates);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load event');
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

  const toggleCoOrg = (orgId: string) => {
    setOrganizationIds((prev) =>
      prev.includes(orgId) ? prev.filter((item) => item !== orgId) : [...prev, orgId]
    );
  };

  const handleSave = async () => {
    if (!eventName.trim()) {
      setError('Event Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const mergedOrgIds = Array.from(
        new Set([...(organizationId ? [organizationId] : []), ...organizationIds])
      );
      const res = await apiPut(`/api/projects/${id}`, {
        eventName: eventName.trim(),
        eventDate: eventDate || undefined,
        location: location.trim(),
        description: description.trim(),
        viewSlug: viewSlug.trim() || undefined,
        editSlug: editSlug.trim() || undefined,
        partner1Id: partner1Id || null,
        partner2Id: partner2Id || null,
        organizationId: organizationId || null,
        organizationIds: mergedOrgIds,
        competitionType: competitionType || null,
        competition: {
          sport,
          governingOrgId: organizationId || null,
          format,
          division,
          tierLabel: tierLabel.trim() || null,
          sponsorTitle: sponsorTitle.trim() || null,
          season: season.trim() || '2025/2026',
        },
        styleId: styleId || null,
        reportTemplateId: reportTemplateId || null,
        hashtags,
        categorizedHashtags,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save event settings');
      }
      setSuccessMessage('Event settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save event settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className={formStyles.loadingState}>Loading event setup…</div>;
  }

  return (
    <AdminEditorScaffold
      tabs={
        <EntityWorkspaceTabs
          ariaLabel="Event workspace navigation"
          backHref="/admin/events"
          backLabel="Events"
          tabs={[
            { label: 'Overview', href: `/admin/events/${id}`, icon: 'event' },
            { label: 'Setup & Edit', href: `/admin/events/${id}/edit`, icon: 'settings' },
            { label: 'Metrics Table', href: `/admin/events/${id}/kyc-data`, icon: 'table_chart' },
            { label: 'AI Photo Proof', href: `/admin/analytics/ai/${id}`, icon: 'smart_toy' },
            { label: 'Stats Recorder', href: `/edit/${editSlug || id}`, icon: 'edit', external: true },
            { label: 'Classic Report', href: `/report/${viewSlug || id}`, icon: 'bar_chart', external: true },
          ]}
        />
      }
      header={
        <WorkspaceHeader
          eyebrow="Event Configuration"
          title={eventName || 'Edit Event'}
          subtitle="Manage matchup clubs, governing federations, competition metadata, report templates, and slugs."
          emoji="🏟️"
        />
      }
      onSave={handleSave}
      onCancel={() => router.push(`/admin/events/${id}`)}
      isSaving={saving}
      disableSave={!eventName.trim()}
      error={error}
      successMessage={successMessage}
    >
      <FormSection
        title="Event Details"
        description="Core schedule, venue location, and internal event description."
      >
        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-name`} className={formStyles.label}>
              Event Name
            </label>
            <input
              id={`${baseId}-name`}
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className={formStyles.input}
              required
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-date`} className={formStyles.label}>
              Event Date
            </label>
            <input
              id={`${baseId}-date`}
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={formStyles.input}
            />
          </div>
        </div>

        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-loc`} className={formStyles.label}>
              Venue / Location
            </label>
            <input
              id={`${baseId}-loc`}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. MVM Dome, Budapest"
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-desc`} className={formStyles.label}>
              Description
            </label>
            <input
              id={`${baseId}-desc`}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional summary or matchday notes"
              className={formStyles.input}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Matchup &amp; Governing Hierarchy"
        description="Assign Home &amp; Away clubs, primary governing federation, commercial sponsors, and canonical competition tier."
      >
        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <span className={formStyles.label}>Home Club / Organizer (Partner 1)</span>
            <PartnerSelector
              selectedPartnerId={partner1Id}
              partners={partners}
              onChange={setPartner1Id}
              placeholder="Search Home Club..."
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <span className={formStyles.label}>Away Club / Opponent (Partner 2)</span>
            <PartnerSelector
              selectedPartnerId={partner2Id}
              partners={partners}
              onChange={setPartner2Id}
              placeholder="Search Away Club..."
            />
          </div>
        </div>

        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-org`} className={formStyles.label}>
              Primary Governing Federation / Organization
            </label>
            <select
              id={`${baseId}-org`}
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">None (Standalone Partner Game)</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-comptype`} className={formStyles.label}>
              Competition Classification
            </label>
            <select
              id={`${baseId}-comptype`}
              value={competitionType}
              onChange={(e) => setCompetitionType(e.target.value)}
              className={formStyles.select}
            >
              <option value="">Unspecified</option>
              <option value="domestic_league">Domestic League</option>
              <option value="international_club">International Club</option>
              <option value="cup">Cup</option>
              <option value="friendly">Friendly</option>
              <option value="standalone">Standalone</option>
            </select>
          </div>
        </div>

        <div className={formStyles.gridThree}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-sport`} className={formStyles.label}>
              Sport
            </label>
            <select
              id={`${baseId}-sport`}
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className={formStyles.select}
            >
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="handball">Handball</option>
              <option value="ice_hockey">Ice Hockey</option>
              <option value="volleyball">Volleyball</option>
              <option value="aquatics">Aquatics / Water Polo</option>
              <option value="motorsport">Motorsport</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-format`} className={formStyles.label}>
              Format
            </label>
            <select
              id={`${baseId}-format`}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={formStyles.select}
            >
              <option value="league">League</option>
              <option value="cup">Cup</option>
              <option value="super_cup">Super Cup</option>
              <option value="qualifier">Qualifier</option>
              <option value="tournament">Tournament</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-division`} className={formStyles.label}>
              Division
            </label>
            <select
              id={`${baseId}-division`}
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className={formStyles.select}
            >
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="mixed">Mixed</option>
              <option value="youth_u21">Youth U21</option>
              <option value="youth_u20">Youth U20</option>
            </select>
          </div>
        </div>

        <div className={formStyles.gridThree}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-tier`} className={formStyles.label}>
              Tier / League Label
            </label>
            <input
              id={`${baseId}-tier`}
              type="text"
              value={tierLabel}
              onChange={(e) => setTierLabel(e.target.value)}
              placeholder="e.g. NB I, NB I. A, EHF Champions League"
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-sponsor`} className={formStyles.label}>
              Title Sponsor
            </label>
            <input
              id={`${baseId}-sponsor`}
              type="text"
              value={sponsorTitle}
              onChange={(e) => setSponsorTitle(e.target.value)}
              placeholder="e.g. Tippmix, OTP Bank, MOL"
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-season`} className={formStyles.label}>
              Season
            </label>
            <input
              id={`${baseId}-season`}
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g. 2025/2026"
              className={formStyles.input}
            />
          </div>
        </div>

        {organizations.length > 0 && (
          <div className={formStyles.fieldGroup}>
            <span className={formStyles.label}>Co-Owning / Sponsoring Organizations</span>
            <p className={formStyles.hint}>
              Select any additional sponsor or federation rollups that include this event.
            </p>
            <div className={formStyles.checkboxGrid}>
              {organizations.map((org) => (
                <label key={org._id} className={formStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={organizationIds.includes(org._id) || organizationId === org._id}
                    onChange={() => toggleCoOrg(org._id)}
                  />
                  <span>{org.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Branding &amp; Report Defaults"
        description="Override visual theme and report template for this specific event (falls back to Partner 1 defaults when blank)."
      >
        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-style`} className={formStyles.label}>
              Report Visual Theme
            </label>
            <select
              id={`${baseId}-style`}
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">Inherit from Home Club / Default</option>
              {stylesList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-tpl`} className={formStyles.label}>
              Report Template
            </label>
            <select
              id={`${baseId}-tpl`}
              value={reportTemplateId}
              onChange={(e) => setReportTemplateId(e.target.value)}
              className={formStyles.select}
            >
              <option value="">Inherit from Home Club / Default</option>
              {templatesList.map((tpl) => (
                <option key={tpl._id} value={tpl._id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Slugs &amp; Cross-App Integrations"
        description="Public report slug, private stats recorder slug, and connected Camera event link."
      >
        <div className={formStyles.gridTwo}>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-viewslug`} className={formStyles.label}>
              Public Report Slug (/report/[slug])
            </label>
            <input
              id={`${baseId}-viewslug`}
              type="text"
              value={viewSlug}
              onChange={(e) => setViewSlug(e.target.value)}
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.fieldGroup}>
            <label htmlFor={`${baseId}-editslug`} className={formStyles.label}>
              Matchday Recorder Slug (/edit/[slug])
            </label>
            <input
              id={`${baseId}-editslug`}
              type="text"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className={formStyles.input}
            />
          </div>
        </div>

        {cameraEventId && (
          <div className={formStyles.kvRow}>
            <span className={formStyles.kvLabel}>Connected Camera Event ID</span>
            <span className={formStyles.kvValue}>{cameraEventId}</span>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Hashtags"
        description="General and categorized tags used for explorer reports and automated aggregations."
      >
        <UnifiedHashtagInput
          generalHashtags={hashtags}
          onGeneralChange={setHashtags}
          categorizedHashtags={categorizedHashtags}
          onCategorizedChange={setCategorizedHashtags}
        />
      </FormSection>
    </AdminEditorScaffold>
  );
}
