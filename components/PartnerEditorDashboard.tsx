'use client';

import React, { useState, useEffect } from 'react';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import ImageUploader from './ImageUploader';
import ReportContentManager from './ReportContentManager';
import UnifiedTextInput from './UnifiedTextInput';
import UnifiedCheckboxField from './UnifiedCheckboxField';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations
} from '@/lib/hashtagCategoryUtils';
import { apiPut } from '@/lib/apiClient';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  showEmoji?: boolean;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleId?: string;
  reportTemplateId?: string;
  clickerSetId?: string;
  showEventsList?: boolean; // WHAT: Controls visibility of events list on partner report page
  showEventsListTitle?: boolean; // WHAT: Controls visibility of events list title on partner report page
  showEventsListDetails?: boolean; // WHAT: Controls whether event cards show detailed info or just titles
  showOnlyTeam1Events?: boolean; // WHAT: Restrict partner report data to local-home / team-1 appearances
  createdAt: string;
  updatedAt: string;
  // WHAT: Partner-level stats for content editing only
  // WHY: Mathematical data comes from events, only text/image content is editable
  stats: {
    [key: string]: string | undefined;
  };
}

interface PartnerEditorDashboardProps {
  partner: Partner;
  variantSlug?: string | null;
}

export default function PartnerEditorDashboard({ partner: initialPartner, variantSlug }: PartnerEditorDashboardProps) {
  const [partner, setPartner] = useState<Partner>(initialPartner);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update partner when initialPartner changes
  useEffect(() => {
    setPartner(initialPartner);
  }, [initialPartner]);

  const persistPartner = async (nextPartner: Partner, nextStats?: typeof partner.stats) => {
    setSaveStatus('saving');
    try {
      const result = variantSlug && variantSlug !== 'default'
        ? await apiPut(`/api/partners/edit/${nextPartner._id}?variant=${encodeURIComponent(variantSlug)}`, {
            metadata: {
              emoji: nextPartner.emoji,
              logoUrl: nextPartner.logoUrl,
              stats: nextStats || nextPartner.stats,
              styleId: nextPartner.styleId,
              reportTemplateId: nextPartner.reportTemplateId,
              showEmoji: nextPartner.showEmoji,
              showEventsList: nextPartner.showEventsList,
              showEventsListTitle: nextPartner.showEventsListTitle,
              showEventsListDetails: nextPartner.showEventsListDetails,
              showOnlyTeam1Events: nextPartner.showOnlyTeam1Events,
            },
          })
        : await apiPut('/api/partners', {
            partnerId: nextPartner._id,
            name: nextPartner.name,
            emoji: nextPartner.emoji,
            logoUrl: nextPartner.logoUrl,
            hashtags: nextPartner.hashtags,
            categorizedHashtags: nextPartner.categorizedHashtags,
            stats: nextStats || nextPartner.stats,
            styleId: nextPartner.styleId,
            reportTemplateId: nextPartner.reportTemplateId,
            showEventsList: nextPartner.showEventsList,
            showEventsListTitle: nextPartner.showEventsListTitle,
            showEventsListDetails: nextPartner.showEventsListDetails,
            showOnlyTeam1Events: nextPartner.showOnlyTeam1Events
          });

      if (result.success) {
        if (result.partner) {
          setPartner((prev) => ({
            ...prev,
            ...result.partner,
          }));
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.error('Save failed:', result.error || 'Unknown error');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save partner:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // WHAT: Auto-save function with CSRF token support
  // WHY: Persist partner content changes to database immediately after user action
  // HOW: Use apiPut() which automatically includes CSRF token in request headers
  const savePartner = async (updatedStats?: typeof partner.stats) => {
    await persistPartner(partner, updatedStats);
  };

  // WHAT: Handle showEventsListDetails toggle
  // WHY: Allow partners to control whether event cards show detailed info or just titles
  const handleShowEventsListDetailsToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showEventsListDetails: checked };
    setPartner(updatedPartner);
    await persistPartner(updatedPartner);
  };

  // WHAT: Handle showEventsListTitle toggle
  // WHY: Allow partners to control whether events list title appears on their report page
  const handleShowEventsListTitleToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showEventsListTitle: checked };
    setPartner(updatedPartner);
    await persistPartner(updatedPartner);
  };

  // WHAT: Handle showEventsList toggle
  // WHY: Allow partners to control whether events list appears on their report page
  const handleShowEventsListToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showEventsList: checked };
    setPartner(updatedPartner);
    await persistPartner(updatedPartner);
  };

  // WHAT: Handle local-home/team-1 filter toggle
  // WHY: Keep partner report aggregates and event list scoped to local-home appearances when needed
  const handleShowOnlyTeam1EventsToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showOnlyTeam1Events: checked };
    setPartner(updatedPartner);
    await persistPartner(updatedPartner);
  };

  const handleLogoUrlSave = async (logoUrl: string) => {
    const normalizedLogoUrl = logoUrl.trim();
    const updatedPartner = {
      ...partner,
      logoUrl: normalizedLogoUrl || undefined,
    };
    setPartner(updatedPartner);
    await persistPartner(updatedPartner);
  };

  const handleLogoUpload = async (logoUrl: string | null) => {
    const updatedPartner = {
      ...partner,
      logoUrl: logoUrl || undefined,
    };
    setPartner(updatedPartner);
    await persistPartner(updatedPartner);
  };

  // Get all hashtag representations for display
  const allHashtagRepresentations = getAllHashtagRepresentations({ 
    hashtags: partner.hashtags || [], 
    categorizedHashtags: partner.categorizedHashtags || {} 
  });

  return (
    <div className="admin-container">
      {/* Header with same styling as event editor */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">
              {partner.showEmoji !== false ? partner.emoji : ''} {partner.name}
            </h1>
            <p className="admin-subtitle">
              {variantSlug && variantSlug !== 'default'
                ? `Partner Report Variant Editor - ${variantSlug}`
                : 'Partner Content Editor - Report Text & Images'}
            </p>
            
            {/* Beautiful hashtag display - showing all hashtags including categorized ones */}
            {allHashtagRepresentations.length > 0 && (
              <div className="centered-pill-row mt-2">
                {allHashtagRepresentations.map((hashtagDisplay, index) => (
                  <ColoredHashtagBubble 
                    key={index}
                    hashtag={hashtagDisplay}
                    showCategoryPrefix={true}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="admin-user-info">
            <div className="admin-badge editor-statusBadge">
              <p className="admin-role">🏢 Partner Editor</p>
              <p className="admin-level">📦 Content Only</p>
              <p className="admin-status">
                {saveStatus === 'saving' && '💾 Saving...'}
                {saveStatus === 'saved' && '✅ Saved'}
                {saveStatus === 'error' && '❌ Save Error'}
                {saveStatus === 'idle' && '📝 Ready'}
              </p>
              
              {/* Info about what can be edited */}
              <div className="editor-statusHint">
                <p>✅ Text & Image Content</p>
                <p>❌ Numbers from Events</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* WHAT: Partner-level Report Content Management */}
        {/* WHY: Allow editing of reportText* and reportImage* fields for partner customization */}
        {/* HOW: Use same ReportContentManager as events but with partner stats */}
        <ColoredCard>
          <h2 className="section-title">📦 Partner Report Content</h2>
          <div className="editor-info-panel">
            <h4 className="editor-info-panelTitle">ℹ️ Partner Content Editing</h4>
            <ul className="editor-info-panelList">
              <li>• <strong>Text & Images:</strong> Edit partner-specific content (reportText*, reportImage*)</li>
              <li>• <strong>Mathematical Data:</strong> Comes from aggregated included event data (not editable here)</li>
              <li>• <strong>Charts:</strong> Will show partner content + aggregated event numbers</li>
              <li>• <strong>Usage:</strong> Upload partner logos, add partner descriptions, custom messaging</li>
            </ul>
          </div>
          
          <ReportContentManager
            stats={partner.stats as any}
            onCommit={(newStats) => {
              setPartner(prev => ({ ...prev, stats: newStats as any }));
              savePartner(newStats as any);
            }}
          />
        </ColoredCard>

        {/* WHAT: Partner Information Display */}
        {/* WHY: Show partner details for context while editing */}
        <ColoredCard>
          <h2 className="section-title">🏢 Partner Information</h2>
          <div className="editor-detailStack">
            <div className="editor-detailRow">
              <span className="text-2xl">{partner.showEmoji !== false ? partner.emoji : ''}</span>
              <div>
                <h3 className="editor-detailHeading">{partner.name}</h3>
                <p className="editor-detailText">Partner ID: {partner._id}</p>
              </div>
            </div>
            
            {partner.logoUrl && (
              <div>
                <p className="editor-logoPreviewLabel">Partner Logo:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={partner.logoUrl} 
                  alt={`${partner.name} logo`}
                  className="editor-logoPreview"
                />
              </div>
            )}

            <div className="editor-subsection">
              <h3 className="editor-subsectionTitle">Logo Management</h3>
              <UnifiedTextInput
                label="Logo URL"
                value={partner.logoUrl || ''}
                onSave={handleLogoUrlSave}
                placeholder="https://example.com/logo.png"
                type="url"
                autoComplete="url"
              />
              <p className="editor-helperText">
                Paste an existing logo URL, or upload an image below to store it on ImgBB and save the hosted URL automatically.
              </p>
              <ImageUploader
                label="Upload Logo"
                value={partner.logoUrl}
                onChange={handleLogoUpload}
                maxSizeMB={10}
              />
            </div>
            
            {/* WHAT: Events List Visibility Control */}
            {/* WHY: Allow partners to control whether events list appears on their report page */}
            <div className="editor-subsection">
              <UnifiedCheckboxField
                id="showEventsList"
                label="Show Events List on Report Page"
                checked={partner.showEventsList ?? true}
                onChange={handleShowEventsListToggle}
                hint={`Controls whether "${partner.name} Events (X)" appears at the bottom of the partner report page.`}
              />

              <UnifiedCheckboxField
                id="showEventsListTitle"
                label="Show Events List Title on Report Page"
                checked={partner.showEventsListTitle ?? true}
                onChange={handleShowEventsListTitleToggle}
                disabled={!(partner.showEventsList ?? true)}
                hint={`Controls whether the title "${partner.name} Events (X)" appears above the events list.`}
              />

              <UnifiedCheckboxField
                id="showEventsListDetails"
                label="Show Event Card Details on Report Page"
                checked={partner.showEventsListDetails ?? true}
                onChange={handleShowEventsListDetailsToggle}
                disabled={!(partner.showEventsList ?? true)}
                hint="Controls whether event cards show detailed info and actions or just the event title."
              />

              <UnifiedCheckboxField
                id="showOnlyTeam1Events"
                label="Only Include Local/Home Events (Team 1)"
                checked={partner.showOnlyTeam1Events ?? false}
                onChange={handleShowOnlyTeam1EventsToggle}
                hint="Filters totals, charts, and the events list to only include team-1 / home appearances."
              />
            </div>
            
            <div className="editor-metaList">
              <p>Created: {new Date(partner.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(partner.updatedAt).toLocaleDateString()}</p>
              {partner.styleId && <p>Style ID: {partner.styleId}</p>}
              {partner.reportTemplateId && <p>Template ID: {partner.reportTemplateId}</p>}
            </div>
          </div>
        </ColoredCard>

        {/* WHAT: Usage Instructions */}
        {/* WHY: Help users understand how partner content editing works */}
        <ColoredCard>
          <h2 className="section-title">📚 How Partner Content Works</h2>
          <div className="editor-guide">
            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">🎯 What You Can Edit</h4>
              <ul className="editor-guideList">
                <li>• <strong>Partner Texts:</strong> Custom descriptions, messages, notes</li>
                <li>• <strong>Partner Images:</strong> Logos, banners, promotional images</li>
                <li>• <strong>Report Content:</strong> Content that appears in partner reports</li>
              </ul>
            </div>
            
            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">📊 What Comes from Events</h4>
              <ul className="editor-guideList">
                <li>• <strong>Fan Numbers:</strong> Total fans from included partner events</li>
                <li>• <strong>Image Counts:</strong> Total images from included partner events</li>
                <li>• <strong>Demographics:</strong> Age and gender data from included events</li>
                <li>• <strong>Engagement:</strong> Mathematical calculations from included events</li>
              </ul>
            </div>
            
            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">🔄 How It Works Together</h4>
              <ul className="editor-guideList">
                <li>• Partner reports show <strong>aggregated included event data</strong> for numbers</li>
                <li>• Partner reports show <strong>partner-specific content</strong> for text/images</li>
                <li>• Best of both: Real data + Custom branding</li>
              </ul>
            </div>
          </div>
        </ColoredCard>
      </div>
    </div>
  );
}
