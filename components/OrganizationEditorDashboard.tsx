'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ColoredCard from './ColoredCard';
import ReportContentManager from './ReportContentManager';
import { apiPut } from '@/lib/apiClient';

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
}

export default function OrganizationEditorDashboard({ organization: initialOrg }: OrganizationEditorDashboardProps) {
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
      const result = await apiPut(`/api/organizations/edit/${org._id}`, {
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
            <p className="admin-subtitle">Organization Report Editor</p>
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
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Organization Content Editing</h4>
            <ul className="text-sm text-blue-700 space-y-1">
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

          <div className="form-group mb-3">
            <label className="form-label-block">Organization Emoji</label>
            <input
              type="text"
              className="form-input"
              value={settingsDraft.emoji}
              maxLength={4}
              onChange={(event) => {
                const emoji = Array.from(event.target.value.trim())[0] || '';
                setSettingsDraft((prev) => ({ ...prev, emoji }));
              }}
              placeholder="🏢"
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label-block">
              <input
                type="checkbox"
                checked={settingsDraft.showEmoji}
                onChange={(event) => handleBooleanSettingChange('showEmoji', event.target.checked)}
                className="mr-2"
              />
              Show emoji in report header
            </label>
          </div>

          <div className="form-group mb-3">
            <label className="form-label-block">Organization Logo URL</label>
            <input
              type="text"
              className="form-input"
              value={settingsDraft.logoUrl}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, logoUrl: event.target.value }))}
              placeholder="https://..."
            />
            <p className="form-hint">Displayed in organization report hero and member sections.</p>
          </div>

          <div className="form-group mb-3">
            <label className="form-label-block">Report Visual Style</label>
            <select
              className="form-input"
              value={settingsDraft.styleId}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, styleId: event.target.value }))}
              disabled={optionsLoading}
            >
              <option value="">— Use Default Style —</option>
              {availableStyles.map((style) => (
                <option key={style._id} value={style._id}>
                  {style.name}
                </option>
              ))}
            </select>
            <p className="form-hint">Report color theme (26-color system) for this organization report page.</p>
          </div>

          <div className="form-group mb-3">
            <label className="form-label-block">Report Template</label>
            <select
              className="form-input"
              value={settingsDraft.reportTemplateId}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, reportTemplateId: event.target.value }))}
              disabled={optionsLoading}
            >
              <option value="">— Use Default Template —</option>
              {availableTemplates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
            <p className="form-hint">Controls which report layout the organization page uses.</p>
          </div>

          <div className="form-group mb-4">
            <label className="form-label-block">Clicker Set</label>
            <select
              className="form-input"
              value={settingsDraft.clickerSetId}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, clickerSetId: event.target.value }))}
              disabled={optionsLoading}
            >
              <option value="">— Use Default Clicker —</option>
              {availableClickerSets.map((set) => (
                <option key={set._id} value={set._id}>
                  {set.isDefault ? '⭐ ' : ''}
                  {set.name}
                </option>
              ))}
            </select>
            <p className="form-hint">Stored for org-level defaults and future member/event tooling.</p>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="showMembersList"
                checked={settingsDraft.showMembersList}
                onChange={(event) => handleBooleanSettingChange('showMembersList', event.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="showMembersList" className="text-sm font-medium text-gray-700">
                Show Members List on Report Page
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Controls whether the organization member cards appear below the main report content.
            </p>

            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="showMembersListTitle"
                checked={settingsDraft.showMembersListTitle}
                onChange={(event) => handleBooleanSettingChange('showMembersListTitle', event.target.checked)}
                disabled={!settingsDraft.showMembersList}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
              />
              <label htmlFor="showMembersListTitle" className={`text-sm font-medium ${!settingsDraft.showMembersList ? 'text-gray-400' : 'text-gray-700'}`}>
                Show Members List Title
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Controls whether the “Members (X)” heading appears above the member list.
            </p>

            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="showMembersListDetails"
                checked={settingsDraft.showMembersListDetails}
                onChange={(event) => handleBooleanSettingChange('showMembersListDetails', event.target.checked)}
                disabled={!settingsDraft.showMembersList}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
              />
              <label htmlFor="showMembersListDetails" className={`text-sm font-medium ${!settingsDraft.showMembersList ? 'text-gray-400' : 'text-gray-700'}`}>
                Show Member Card Details
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Controls whether member cards show labels and report actions or just the member name.
            </p>

            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="showOrganizationEventsList"
                checked={settingsDraft.showEventsList}
                onChange={(event) => handleBooleanSettingChange('showEventsList', event.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="showOrganizationEventsList" className="text-sm font-medium text-gray-700">
                Show Events List on Report Page
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Controls whether organization-related event cards appear at the bottom of the report.
            </p>

            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="showOrganizationEventsListTitle"
                checked={settingsDraft.showEventsListTitle}
                onChange={(event) => handleBooleanSettingChange('showEventsListTitle', event.target.checked)}
                disabled={!settingsDraft.showEventsList}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
              />
              <label htmlFor="showOrganizationEventsListTitle" className={`text-sm font-medium ${!settingsDraft.showEventsList ? 'text-gray-400' : 'text-gray-700'}`}>
                Show Events List Title
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Controls whether the “Events (X)” heading appears above the event list.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="showOrganizationEventsListDetails"
                checked={settingsDraft.showEventsListDetails}
                onChange={(event) => handleBooleanSettingChange('showEventsListDetails', event.target.checked)}
                disabled={!settingsDraft.showEventsList}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
              />
              <label htmlFor="showOrganizationEventsListDetails" className={`text-sm font-medium ${!settingsDraft.showEventsList ? 'text-gray-400' : 'text-gray-700'}`}>
                Show Event Card Details
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-7">
              Controls whether event cards show date, labels, and report actions or only the event name.
            </p>
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
              {resolvedTemplateId && <p>Template ID: {resolvedTemplateId}</p>}
              {org.metadata?.styleId && <p>Style ID: {org.metadata.styleId}</p>}
              {org.metadata?.clickerSetId && <p>Clicker Set ID: {org.metadata.clickerSetId}</p>}
            </div>
          </div>
        </ColoredCard>

        <ColoredCard>
          <h2 className="section-title">📚 How Organization Content Works</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎯 What You Can Edit</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Organization Texts:</strong> Executive messaging, intros, and summaries</li>
                <li>• <strong>Organization Images:</strong> Logos, banners, and organization-level creative</li>
                <li>• <strong>Report Presentation:</strong> Template, style, clicker default, and list visibility</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">📊 What Comes from Members and Events</h4>
              <ul className="space-y-1 text-gray-600">
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
