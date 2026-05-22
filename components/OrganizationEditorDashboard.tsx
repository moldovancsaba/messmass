'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ColoredCard from './ColoredCard';
import ReportContentManager from './ReportContentManager';
import { apiPut } from '@/lib/apiClient';
import UnifiedInputField from './UnifiedInputField';
import UnifiedSelectField from './UnifiedSelectField';
import UnifiedCheckboxField from './UnifiedCheckboxField';

type OrganizationMetadata = {
  emoji?: string;
  showEmoji?: boolean;
  logoUrl?: string;
  stats?: {
    [key: string]: string | undefined;
  };
  reportId?: string;
  reportTemplateId?: string;
  styleId?: string;
  clickerSetId?: string;
  showMembersList?: boolean;
  showMembersListTitle?: boolean;
  showMembersListDetails?: boolean;
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
};

interface Organization {
  _id: string;
  name: string;
  slug: string;
  status: string;
  metadata?: OrganizationMetadata;
  createdAt: string;
  updatedAt: string;
}

interface ReportTemplateOption {
  _id: string;
  name: string;
  type: string;
}

interface ReportStyleOption {
  _id: string;
  name: string;
}

interface ClickerSetOption {
  _id: string;
  name: string;
  isDefault?: boolean;
}

interface OrganizationEditorDashboardProps {
  organization: Organization;
  variantSlug?: string | null;
}

export default function OrganizationEditorDashboard({ organization: initialOrg, variantSlug }: OrganizationEditorDashboardProps) {
  const [org, setOrg] = useState<Organization>(initialOrg);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [availableTemplates, setAvailableTemplates] = useState<ReportTemplateOption[]>([]);
  const [availableStyles, setAvailableStyles] = useState<ReportStyleOption[]>([]);
  const [availableClickerSets, setAvailableClickerSets] = useState<ClickerSetOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [settingsDraft, setSettingsDraft] = useState({
    emoji: '',
    showEmoji: true,
    logoUrl: '',
    styleId: '',
    reportTemplateId: '',
    clickerSetId: '',
    showMembersList: true,
    showMembersListTitle: true,
    showMembersListDetails: true,
    showEventsList: true,
    showEventsListTitle: true,
    showEventsListDetails: true,
  });

  useEffect(() => {
    setOrg(initialOrg);
  }, [initialOrg]);

  useEffect(() => {
    const metadata = org.metadata || {};
    setSettingsDraft({
      emoji: metadata.emoji || '',
      showEmoji: metadata.showEmoji !== false,
      logoUrl: metadata.logoUrl || '',
      styleId: metadata.styleId || '',
      reportTemplateId: metadata.reportTemplateId || metadata.reportId || '',
      clickerSetId: metadata.clickerSetId || '',
      showMembersList: metadata.showMembersList !== false,
      showMembersListTitle: metadata.showMembersListTitle !== false,
      showMembersListDetails: metadata.showMembersListDetails !== false,
      showEventsList: metadata.showEventsList !== false,
      showEventsListTitle: metadata.showEventsListTitle !== false,
      showEventsListDetails: metadata.showEventsListDetails !== false,
    });
  }, [org]);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [templatesRes, stylesRes, clickersRes] = await Promise.all([
          fetch('/api/report-templates?includeAssociations=false', { cache: 'no-store' }),
          fetch('/api/report-styles', { cache: 'no-store' }),
          fetch('/api/clicker-sets', { cache: 'no-store' }),
        ]);

        const [templatesData, stylesData, clickersData] = await Promise.all([
          templatesRes.json(),
          stylesRes.json(),
          clickersRes.json(),
        ]);

        if (templatesData?.success) {
          setAvailableTemplates((templatesData.templates || []).map((template: any) => ({
            _id: String(template._id),
            name: String(template.name || 'Unnamed Template'),
            type: String(template.type || 'partner'),
          })));
        }

        if (stylesData?.success) {
          setAvailableStyles((stylesData.styles || []).map((style: any) => ({
            _id: String(style._id),
            name: String(style.name || 'Unnamed Style'),
          })));
        }

        if (clickersData?.success) {
          setAvailableClickerSets((clickersData.sets || []).map((set: any) => ({
            _id: String(set._id),
            name: String(set.name || 'Unnamed Clicker Set'),
            isDefault: Boolean(set.isDefault),
          })));
        }
      } catch (error) {
        console.error('Failed to load organization editor options:', error);
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const saveOrg = async ({
    updatedStats,
    metadataPatch,
  }: {
    updatedStats?: OrganizationMetadata['stats'];
    metadataPatch?: Partial<OrganizationMetadata>;
  } = {}) => {
    setSaveStatus('saving');

    const currentMetadata = org.metadata || {};
    const nextMetadata: OrganizationMetadata = {
      ...currentMetadata,
      ...(metadataPatch || {}),
    };

    if (updatedStats !== undefined) {
      nextMetadata.stats = updatedStats;
    } else {
      nextMetadata.stats = currentMetadata.stats || {};
    }

    if (metadataPatch && Object.prototype.hasOwnProperty.call(metadataPatch, 'reportTemplateId')) {
      nextMetadata.reportId = nextMetadata.reportTemplateId || undefined;
    }

    try {
      const query = variantSlug ? `?variant=${encodeURIComponent(variantSlug)}` : '';
      const result = await apiPut(`/api/organizations/edit/${org._id}${query}`, {
        metadata: nextMetadata,
      });

      if (result.success) {
        const updatedOrganization = result.organization
          ? {
              ...org,
              ...result.organization,
              metadata: result.organization.metadata || nextMetadata,
            }
          : {
              ...org,
              metadata: nextMetadata,
              updatedAt: new Date().toISOString(),
            };

        setOrg(updatedOrganization);
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

  const saveSettings = async () => {
    await saveOrg({
      metadataPatch: {
        emoji: settingsDraft.emoji || undefined,
        showEmoji: settingsDraft.showEmoji,
        logoUrl: settingsDraft.logoUrl || undefined,
        styleId: settingsDraft.styleId || undefined,
        reportTemplateId: settingsDraft.reportTemplateId || undefined,
        clickerSetId: settingsDraft.clickerSetId || undefined,
        showMembersList: settingsDraft.showMembersList,
        showMembersListTitle: settingsDraft.showMembersListTitle,
        showMembersListDetails: settingsDraft.showMembersListDetails,
        showEventsList: settingsDraft.showEventsList,
        showEventsListTitle: settingsDraft.showEventsListTitle,
        showEventsListDetails: settingsDraft.showEventsListDetails,
      },
    });
  };

  const handleBooleanSettingChange = async (
    key:
      | 'showEmoji'
      | 'showMembersList'
      | 'showMembersListTitle'
      | 'showMembersListDetails'
      | 'showEventsList'
      | 'showEventsListTitle'
      | 'showEventsListDetails',
    value: boolean
  ) => {
    setSettingsDraft((prev) => ({ ...prev, [key]: value }));
    await saveOrg({ metadataPatch: { [key]: value } });
  };

  const resolvedTemplateId = useMemo(
    () => org.metadata?.reportTemplateId || org.metadata?.reportId,
    [org.metadata?.reportId, org.metadata?.reportTemplateId]
  );

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">
              {org.metadata?.showEmoji === false ? '' : org.metadata?.emoji || '🏢'} {org.name}
            </h1>
            <p className="admin-subtitle">
              {variantSlug && variantSlug !== 'default'
                ? `Organization Report Variant Editor · ${variantSlug}`
                : 'Organization Report Editor'}
            </p>
          </div>
          <div className="admin-user-info">
            <div className="admin-badge editor-statusBadge">
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
          <div className="editor-info-panel">
            <h4 className="editor-info-panelTitle">ℹ️ Organization Content Editing</h4>
            <ul className="editor-info-panelList">
              <li>• <strong>Text & Images:</strong> Edit organization-specific content (reportText*, reportImage*)</li>
              <li>• <strong>Mathematical Data:</strong> Comes from aggregated member and event data</li>
              <li>• <strong>Lists:</strong> Control whether member and event sections appear on the report</li>
              <li>• <strong>Branding:</strong> Configure emoji, logo, template, style, and clicker defaults</li>
            </ul>
          </div>

          <ReportContentManager
            stats={(org.metadata?.stats || {}) as any}
            onCommit={(newStats) => {
              setOrg((prev) => ({
                ...prev,
                metadata: { ...prev.metadata, stats: newStats as any },
              }));
              saveOrg({ updatedStats: newStats as any });
            }}
          />
        </ColoredCard>

        <ColoredCard>
          <h2 className="section-title">🎛️ Report Configuration</h2>

          <UnifiedInputField
            label="Organization Emoji"
            value={settingsDraft.emoji}
            onChange={(value) => {
              const emoji = Array.from(value.trim())[0] || '';
              setSettingsDraft((prev) => ({ ...prev, emoji }));
            }}
            placeholder="🏢"
            maxLength={4}
          />

          <UnifiedCheckboxField
            id="showOrganizationEmoji"
            label="Show emoji in report header"
            checked={settingsDraft.showEmoji}
            onChange={(checked) => handleBooleanSettingChange('showEmoji', checked)}
          />

          <UnifiedInputField
            label="Organization Logo URL"
            value={settingsDraft.logoUrl}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, logoUrl: value }))}
            placeholder="https://..."
            hint="Displayed in organization report hero and member sections."
          />

          <UnifiedSelectField
            label="Report Visual Style"
            value={settingsDraft.styleId}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, styleId: value }))}
            disabled={optionsLoading}
            options={[
              { value: '', label: '— Use Default Style —' },
              ...availableStyles.map((style) => ({ value: style._id, label: style.name })),
            ]}
          />
          <p className="form-hint">Report color theme (26-color system) for this organization report page.</p>

          <UnifiedSelectField
            label="Report Template"
            value={settingsDraft.reportTemplateId}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, reportTemplateId: value }))}
            disabled={optionsLoading}
            options={[
              { value: '', label: '— Use Default Template —' },
              ...availableTemplates.map((template) => ({
                value: template._id,
                label: `${template.name} (${template.type})`,
              })),
            ]}
          />
          <p className="form-hint">Controls which report layout the organization page uses.</p>

          <UnifiedSelectField
            label="Clicker Set"
            value={settingsDraft.clickerSetId}
            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, clickerSetId: value }))}
            disabled={optionsLoading}
            options={[
              { value: '', label: '— Use Default Clicker —' },
              ...availableClickerSets.map((set) => ({
                value: set._id,
                label: `${set.isDefault ? '⭐ ' : ''}${set.name}`,
              })),
            ]}
          />
          <p className="form-hint">Stored for org-level defaults and future member/event tooling.</p>

          <div className="editor-subsection">
            <UnifiedCheckboxField
              id="showMembersList"
              label="Show Members List on Report Page"
              checked={settingsDraft.showMembersList}
              onChange={(checked) => handleBooleanSettingChange('showMembersList', checked)}
              hint="Controls whether the organization member cards appear below the main report content."
            />

            <UnifiedCheckboxField
              id="showMembersListTitle"
              label="Show Members List Title"
              checked={settingsDraft.showMembersListTitle}
              onChange={(checked) => handleBooleanSettingChange('showMembersListTitle', checked)}
              disabled={!settingsDraft.showMembersList}
              hint="Controls whether the “Members (X)” heading appears above the member list."
            />

            <UnifiedCheckboxField
              id="showMembersListDetails"
              label="Show Member Card Details"
              checked={settingsDraft.showMembersListDetails}
              onChange={(checked) => handleBooleanSettingChange('showMembersListDetails', checked)}
              disabled={!settingsDraft.showMembersList}
              hint="Controls whether member cards show labels and report actions or just the member name."
            />

            <UnifiedCheckboxField
              id="showOrganizationEventsList"
              label="Show Events List on Report Page"
              checked={settingsDraft.showEventsList}
              onChange={(checked) => handleBooleanSettingChange('showEventsList', checked)}
              hint="Controls whether organization-related event cards appear at the bottom of the report."
            />

            <UnifiedCheckboxField
              id="showOrganizationEventsListTitle"
              label="Show Events List Title"
              checked={settingsDraft.showEventsListTitle}
              onChange={(checked) => handleBooleanSettingChange('showEventsListTitle', checked)}
              disabled={!settingsDraft.showEventsList}
              hint="Controls whether the “Events (X)” heading appears above the event list."
            />

            <UnifiedCheckboxField
              id="showOrganizationEventsListDetails"
              label="Show Event Card Details"
              checked={settingsDraft.showEventsListDetails}
              onChange={(checked) => handleBooleanSettingChange('showEventsListDetails', checked)}
              disabled={!settingsDraft.showEventsList}
              hint="Controls whether event cards show date, labels, and report actions or only the event name."
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={saveStatus === 'saving'}
            onClick={saveSettings}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Organization Settings'}
          </button>
        </ColoredCard>

        <ColoredCard>
          <h2 className="section-title">🏢 Details</h2>
          <div className="editor-detailStack">
            <div className="editor-detailRow">
              <span className="text-2xl">{org.metadata?.emoji || '🏢'}</span>
              <div>
                <h3 className="editor-detailHeading">{org.name}</h3>
                <p className="editor-detailText">Slug: {org.slug}</p>
                <p className="editor-detailText">ID: {org._id}</p>
              </div>
            </div>
            <div className="editor-subsection editor-metaList">
              <p>Created: {new Date(org.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(org.updatedAt).toLocaleString()}</p>
              {resolvedTemplateId && <p>Template ID: {resolvedTemplateId}</p>}
              {org.metadata?.styleId && <p>Style ID: {org.metadata.styleId}</p>}
              {org.metadata?.clickerSetId && <p>Clicker Set ID: {org.metadata.clickerSetId}</p>}
            </div>
          </div>
        </ColoredCard>

        <ColoredCard>
          <h2 className="section-title">📚 How Organization Content Works</h2>
          <div className="editor-guide">
            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">🎯 What You Can Edit</h4>
              <ul className="editor-guideList">
                <li>• <strong>Organization Texts:</strong> Executive messaging, intros, and summaries</li>
                <li>• <strong>Organization Images:</strong> Logos, banners, and organization-level creative</li>
                <li>• <strong>Report Presentation:</strong> Template, style, clicker default, and list visibility</li>
              </ul>
            </div>

            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">📊 What Comes from Members and Events</h4>
              <ul className="editor-guideList">
                <li>• <strong>Aggregated Numbers:</strong> All numeric KPIs are summed from assigned members and linked events</li>
                <li>• <strong>Member Cards:</strong> Partners assigned to the organization</li>
                <li>• <strong>Event Cards:</strong> Organization-related activities exposed on the report</li>
              </ul>
            </div>
          </div>
        </ColoredCard>
      </div>
    </div>
  );
}
