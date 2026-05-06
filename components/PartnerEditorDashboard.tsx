'use client';

import React, { useState, useEffect } from 'react';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import ReportContentManager from './ReportContentManager';
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
}

export default function PartnerEditorDashboard({ partner: initialPartner }: PartnerEditorDashboardProps) {
  const [partner, setPartner] = useState<Partner>(initialPartner);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update partner when initialPartner changes
  useEffect(() => {
    setPartner(initialPartner);
  }, [initialPartner]);

  // WHAT: Auto-save function with CSRF token support
  // WHY: Persist partner content changes to database immediately after user action
  // HOW: Use apiPut() which automatically includes CSRF token in request headers
  const savePartner = async (updatedStats?: typeof partner.stats) => {
    setSaveStatus('saving');
    try {
      // WHAT: Use apiPut() instead of raw fetch() for CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header for all PUT requests
      const result = await apiPut('/api/partners', {
        partnerId: partner._id,
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl,
        hashtags: partner.hashtags,
        categorizedHashtags: partner.categorizedHashtags,
        stats: updatedStats || partner.stats,
        styleId: partner.styleId,
        reportTemplateId: partner.reportTemplateId,
        showEventsList: partner.showEventsList,
        showEventsListTitle: partner.showEventsListTitle,
        showEventsListDetails: partner.showEventsListDetails,
        showOnlyTeam1Events: partner.showOnlyTeam1Events
      });

      // WHAT: Handle successful save response
      // WHY: Provide user feedback that changes were persisted
      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.error('Save failed:', result.error || 'Unknown error');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      // WHAT: Handle network or CSRF token errors
      // WHY: Show error state to user if save fails
      console.error('Failed to save partner:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // WHAT: Handle showEventsListDetails toggle
  // WHY: Allow partners to control whether event cards show detailed info or just titles
  const handleShowEventsListDetailsToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showEventsListDetails: checked };
    setPartner(updatedPartner);
    
    // Save immediately
    setSaveStatus('saving');
    try {
      const result = await apiPut('/api/partners', {
        partnerId: partner._id,
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl,
        hashtags: partner.hashtags,
        categorizedHashtags: partner.categorizedHashtags,
        stats: partner.stats,
        styleId: partner.styleId,
        reportTemplateId: partner.reportTemplateId,
        showEventsList: partner.showEventsList,
        showEventsListTitle: partner.showEventsListTitle,
        showEventsListDetails: checked,
        showOnlyTeam1Events: partner.showOnlyTeam1Events
      });

      if (result.success) {
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

  // WHAT: Handle showEventsListTitle toggle
  // WHY: Allow partners to control whether events list title appears on their report page
  const handleShowEventsListTitleToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showEventsListTitle: checked };
    setPartner(updatedPartner);
    
    // Save immediately
    setSaveStatus('saving');
    try {
      const result = await apiPut('/api/partners', {
        partnerId: partner._id,
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl,
        hashtags: partner.hashtags,
        categorizedHashtags: partner.categorizedHashtags,
        stats: partner.stats,
        styleId: partner.styleId,
        reportTemplateId: partner.reportTemplateId,
        showEventsList: partner.showEventsList,
        showEventsListTitle: checked,
        showEventsListDetails: partner.showEventsListDetails,
        showOnlyTeam1Events: partner.showOnlyTeam1Events
      });

      if (result.success) {
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

  // WHAT: Handle showEventsList toggle
  // WHY: Allow partners to control whether events list appears on their report page
  const handleShowEventsListToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showEventsList: checked };
    setPartner(updatedPartner);
    
    // Save immediately
    setSaveStatus('saving');
    try {
      const result = await apiPut('/api/partners', {
        partnerId: partner._id,
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl,
        hashtags: partner.hashtags,
        categorizedHashtags: partner.categorizedHashtags,
        stats: partner.stats,
        styleId: partner.styleId,
        reportTemplateId: partner.reportTemplateId,
        showEventsList: checked,
        showEventsListTitle: partner.showEventsListTitle,
        showEventsListDetails: partner.showEventsListDetails,
        showOnlyTeam1Events: partner.showOnlyTeam1Events
      });

      if (result.success) {
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

  // WHAT: Handle local-home/team-1 filter toggle
  // WHY: Keep partner report aggregates and event list scoped to local-home appearances when needed
  const handleShowOnlyTeam1EventsToggle = async (checked: boolean) => {
    const updatedPartner = { ...partner, showOnlyTeam1Events: checked };
    setPartner(updatedPartner);

    setSaveStatus('saving');
    try {
      const result = await apiPut('/api/partners', {
        partnerId: partner._id,
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl,
        hashtags: partner.hashtags,
        categorizedHashtags: partner.categorizedHashtags,
        stats: partner.stats,
        styleId: partner.styleId,
        reportTemplateId: partner.reportTemplateId,
        showEventsList: partner.showEventsList,
        showEventsListTitle: partner.showEventsListTitle,
        showEventsListDetails: partner.showEventsListDetails,
        showOnlyTeam1Events: checked
      });

      if (result.success) {
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
              Partner Content Editor - Report Text & Images
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
            <div className="admin-badge p-3">
              <p className="admin-role">🏢 Partner Editor</p>
              <p className="admin-level">📦 Content Only</p>
              <p className="admin-status">
                {saveStatus === 'saving' && '💾 Saving...'}
                {saveStatus === 'saved' && '✅ Saved'}
                {saveStatus === 'error' && '❌ Save Error'}
                {saveStatus === 'idle' && '📝 Ready'}
              </p>
              
              {/* Info about what can be edited */}
              <div className="mt-2 text-xs text-gray-600">
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
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Partner Content Editing</h4>
            <ul className="text-sm text-blue-700 space-y-1">
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
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{partner.showEmoji !== false ? partner.emoji : ''}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                <p className="text-sm text-gray-600">Partner ID: {partner._id}</p>
              </div>
            </div>
            
            {partner.logoUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Partner Logo:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={partner.logoUrl} 
                  alt={`${partner.name} logo`}
                  className="max-w-32 max-h-16 object-contain border border-gray-200 rounded"
                />
              </div>
            )}
            
            {/* WHAT: Events List Visibility Control */}
            {/* WHY: Allow partners to control whether events list appears on their report page */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="showEventsList"
                  checked={partner.showEventsList ?? true}
                  onChange={(e) => handleShowEventsListToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="showEventsList" className="text-sm font-medium text-gray-700">
                  Show Events List on Report Page
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3 ml-7">
                Controls whether &quot;{partner.name} Events (X)&quot; section appears at the bottom of the partner report page
              </p>
              
              {/* WHAT: Events List Title Visibility Control */}
              {/* WHY: Allow partners to show events list but hide the title */}
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="showEventsListTitle"
                  checked={partner.showEventsListTitle ?? true}
                  onChange={(e) => handleShowEventsListTitleToggle(e.target.checked)}
                  disabled={!(partner.showEventsList ?? true)} // Disable if events list is hidden
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                />
                <label htmlFor="showEventsListTitle" className={`text-sm font-medium ${!(partner.showEventsList ?? true) ? 'text-gray-400' : 'text-gray-700'}`}>
                  Show Events List TITLE on Report Page
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3 ml-7">
                Controls whether the title &quot;{partner.name} Events (X)&quot; appears above the events list (only applies when events list is shown)
              </p>
              
              {/* WHAT: Events List Details Visibility Control */}
              {/* WHY: Allow partners to show events list with minimal or detailed cards */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showEventsListDetails"
                  checked={partner.showEventsListDetails ?? true}
                  onChange={(e) => handleShowEventsListDetailsToggle(e.target.checked)}
                  disabled={!(partner.showEventsList ?? true)} // Disable if events list is hidden
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                />
                <label htmlFor="showEventsListDetails" className={`text-sm font-medium ${!(partner.showEventsList ?? true) ? 'text-gray-400' : 'text-gray-700'}`}>
                  Show Event Card DETAILS on Report Page
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Controls whether event cards show detailed info (date, stats, &quot;View Report&quot; button) or just the event title (only applies when events list is shown)
              </p>

              <div className="flex items-center gap-3 mt-3">
                <input
                  type="checkbox"
                  id="showOnlyTeam1Events"
                  checked={partner.showOnlyTeam1Events ?? false}
                  onChange={(e) => handleShowOnlyTeam1EventsToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="showOnlyTeam1Events" className="text-sm font-medium text-gray-700">
                  Only Include Local/Home Events (Team 1)
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Filters the partner report so totals, charts, and the events list only include events where this partner is Team 1, the local/home side.
              </p>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
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
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎯 What You Can Edit</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Partner Texts:</strong> Custom descriptions, messages, notes</li>
                <li>• <strong>Partner Images:</strong> Logos, banners, promotional images</li>
                <li>• <strong>Report Content:</strong> Content that appears in partner reports</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">📊 What Comes from Events</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Fan Numbers:</strong> Total fans from included partner events</li>
                <li>• <strong>Image Counts:</strong> Total images from included partner events</li>
                <li>• <strong>Demographics:</strong> Age and gender data from included events</li>
                <li>• <strong>Engagement:</strong> Mathematical calculations from included events</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🔄 How It Works Together</h4>
              <ul className="space-y-1 text-gray-600">
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
