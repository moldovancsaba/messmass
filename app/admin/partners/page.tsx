'use client';

// WHAT: Refactored Partners admin page using UnifiedAdminPage + partnersAdapter
// WHY: Eliminate hardcoded table HTML, use unified system with Report button support
// MIGRATION: From hardcoded table to adapter-based system (matches /admin/events pattern)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { partnersAdapter } from '@/lib/adapters/partnersAdapter';
import type { PartnerResponse } from '@/lib/partner.types';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import FormModal from '@/components/modals/FormModal';
import SharePopup from '@/components/SharePopup';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import BitlyLinksSelector from '@/components/BitlyLinksSelector';
import EmojiSelector from '@/components/EmojiSelector';
import TheSportsDBSearch from '@/components/TheSportsDBSearch';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import { generateSportsDbHashtags, mergeSportsDbHashtags } from '@/lib/sportsDbHashtagEnricher';

const PAGE_SIZE = 20;

interface BitlyLinkOption {
  _id: string;
  bitlink: string;
  title: string;
  long_url: string;
}

export default function PartnersAdminPageUnified() {
  const { user, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data state
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [allBitlyLinks, setAllBitlyLinks] = useState<BitlyLinkOption[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [availableStyles, setAvailableStyles] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [totalMatched, setTotalMatched] = useState(0);
  
  // Sorting state
  type SortField = 'name' | 'createdAt' | 'updatedAt' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Modal states - Create
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartnerData, setNewPartnerData] = useState({
    name: '',
    emoji: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    bitlyLinkIds: [] as string[],
    styleId: '' as string | null,
    reportTemplateId: '' as string | null,
    sportsDb: undefined as any,
    logoUrl: undefined as string | undefined
  });
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  
  // Modal states - Edit
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerResponse | null>(null);
  
  // Share modal state
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePartnerId, setSharePartnerId] = useState<string>('');
  const [editPartnerData, setEditPartnerData] = useState({
    name: '',
    emoji: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    bitlyLinkIds: [] as string[],
    logoUrl: undefined as string | undefined,
    sportsDb: undefined as any,
    styleId: '' as string | null,
    reportTemplateId: '' as string | null
  });
  const [isUpdatingPartner, setIsUpdatingPartner] = useState(false);
  
  // SportsDB search state
  const [sportsDbSearch, setSportsDbSearch] = useState('');
  const [sportsDbResults, setSportsDbResults] = useState<any[]>([]);
  const [sportsDbSearching, setSportsDbSearching] = useState(false);
  const [sportsDbLinking, setSportsDbLinking] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    venueName: '',
    venueCapacity: '',
    leagueName: '',
    country: '',
    founded: '',
    logoUrl: '',
  });
  
  // Hydrate sort state from URL
  useEffect(() => {
    const sf = searchParams?.get('sortField') as SortField | null;
    const so = searchParams?.get('sortOrder') as SortOrder | null;
    const allowedFields: SortField[] = ['name', 'createdAt', 'updatedAt'];
    const allowedOrders: SortOrder[] = ['asc', 'desc'];
    if (sf && allowedFields.includes(sf)) setSortField(sf);
    if (so && allowedOrders.includes(so)) setSortOrder(so);
  }, [searchParams]);
  
  // WHAT: Load partners with server-side search/sort/pagination
  // WHY: Match events page pattern with database-only logic
  const loadPartners = useCallback(async (resetList = true, showLoadingSpinner = false) => {
    const q = debouncedSearchQuery.trim();
    
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      } else if (!resetList) {
        setIsLoadingMore(true);
      }
      
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }
      
      if (q) {
        params.set('search', q);
      }
      
      params.set('offset', '0');
      
      // WHAT: Add timestamp to force cache-busting
      // WHY: Ensure fresh data after migrations (viewSlug addition)
      params.set('_t', Date.now().toString());
      
      const response = await fetch(`/api/partners?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        if (resetList) {
          setPartners(data.partners);
        } else {
          setPartners(prev => [...prev, ...data.partners]);
        }
        setTotalMatched(data.pagination.total);
        setNextOffset(data.pagination.hasMore ? PAGE_SIZE : null);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
      setError('Failed to load partners');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery, sortField, sortOrder]);
  
  // WHAT: Load more partners handler
  // WHY: Pagination support to load next page of results
  const handleLoadMore = async () => {
    const q = debouncedSearchQuery.trim();
    if (nextOffset === null || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(nextOffset));
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }
      
      if (q) {
        params.set('search', q);
      }
      
      // WHAT: Add timestamp to force cache-busting
      // WHY: Ensure fresh data after migrations
      params.set('_t', Date.now().toString());
      
      const response = await fetch(`/api/partners?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        setPartners(prev => [...prev, ...data.partners]);
        setNextOffset(data.pagination.hasMore ? nextOffset + PAGE_SIZE : null);
      }
    } catch (error) {
      console.error('Failed to load more partners:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    if (user) {
      loadPartners(true, true);
      
      // Load available report templates
      (async () => {
        try {
          const res = await fetch('/api/report-templates?includeAssociations=false');
          const data = await res.json();
          if (data.success) {
            setAvailableTemplates(data.templates.map((t: any) => ({ _id: t._id, name: t.name, type: t.type })));
          }
        } catch (e) {
          console.error('Failed to load report templates', e);
        }
      })();
      
      // Load available report styles
      (async () => {
        try {
          const res = await fetch('/api/report-styles');
          const data = await res.json();
          if (data.success) {
            setAvailableStyles(data.styles.map((s: any) => ({ _id: s._id, name: s.name })));
          }
        } catch (e) {
          console.error('Failed to load report styles', e);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  // Reload on search/sort changes (silent - no spinner)
  useEffect(() => {
    if (user) {
      loadPartners(true, false); // false = no loading spinner, just update data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, sortField, sortOrder]);
  
  // Reload when page becomes visible
  // WHAT: Preserve search/sort state when window regains focus
  // WHY: User expects to see their current search results, not reset to default list
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadPartners(true, false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, loadPartners]);
  
  // WHAT: Lazy load Bitly links only when needed
  // WHY: Performance optimization - only load when opening modals
  const loadBitlyLinks = useCallback(async () => {
    if (allBitlyLinks.length > 0) return;
    
    try {
      const bitlyRes = await fetch('/api/bitly/links?includeUnassigned=true&limit=1000');
      const bitlyData = await bitlyRes.json();
      if (bitlyData.success && bitlyData.links) {
        setAllBitlyLinks(bitlyData.links.map((link: any) => ({
          _id: link._id,
          bitlink: link.bitlink,
          title: link.title,
          long_url: link.long_url,
        })));
      }
    } catch (err) {
      console.error('Failed to load Bitly links:', err);
    }
  }, [allBitlyLinks]);
  
  // WHAT: Handle sorting column click
  // WHY: Three-state cycle per column: asc → desc → clear
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
    
    // Sync to URL
    const params = new URLSearchParams(Array.from(searchParams?.entries() || []));
    if (field && sortOrder !== 'desc') {
      params.set('sortField', field);
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.delete('sortField');
      params.delete('sortOrder');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  
  // WHAT: Handle adding a new partner
  // WHY: Create organization entities
  const handleAddPartner = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!newPartnerData.name.trim() || !newPartnerData.emoji.trim()) {
      setError('Name and emoji are required');
      return;
    }
    
    try {
      setIsCreatingPartner(true);
      const data = await apiPost('/api/partners', newPartnerData);
      
      if (data.success) {
        setSuccessMessage(`✓ Partner "${newPartnerData.name}" created successfully!`);
        setShowAddForm(false);
        setNewPartnerData({
          name: '',
          emoji: '',
          hashtags: [],
          categorizedHashtags: {},
          bitlyLinkIds: [],
          styleId: '',
          reportTemplateId: '',
          sportsDb: undefined,
          logoUrl: undefined
        });
        loadPartners();
      } else {
        setError(data.error || 'Failed to create partner');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create partner error:', err);
    } finally {
      setIsCreatingPartner(false);
    }
  };
  
  // WHAT: Handle updating an existing partner
  // WHY: Allows editing partner details
  const handleUpdatePartner = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!editingPartner || !editPartnerData.name.trim() || !editPartnerData.emoji.trim()) {
      setError('Name and emoji are required');
      return;
    }
    
    try {
      setIsUpdatingPartner(true);
      const data = await apiPut('/api/partners', {
        partnerId: editingPartner._id,
        ...editPartnerData,
      });
      
      if (data.success) {
        setSuccessMessage(`✓ Partner "${editPartnerData.name}" updated successfully!`);
        setShowEditForm(false);
        setEditingPartner(null);
        loadPartners();
      } else {
        setError(data.error || 'Failed to update partner');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update partner error:', err);
    } finally {
      setIsUpdatingPartner(false);
    }
  };
  
  // WHAT: Handle deleting a partner
  // WHY: Remove organizations from system
  const handleDeletePartner = useCallback(async (partnerId: string, partnerName: string) => {
    if (!confirm(`Delete partner "${partnerName}"? This action cannot be undone.`)) {
      return;
    }
    
    setError('');
    setSuccessMessage('');
    
    try {
      const data = await apiDelete(`/api/partners?partnerId=${partnerId}`);
      
      if (data.success) {
        setSuccessMessage(`✓ Partner "${partnerName}" deleted successfully`);
        loadPartners();
      } else {
        setError(data.error || 'Failed to delete partner');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete partner error:', err);
    }
  }, [loadPartners]);
  
  // WHAT: Open edit modal with partner data
  // WHY: Populate form with existing partner values
  // WHAT: Handle manual SportsDB data entry with logo upload
  // WHY: Fallback when TheSportsDB API doesn't have team or returns wrong data
  const handleManualEntry = async () => {
    if (!editingPartner) return;
    
    setError('');
    setSuccessMessage('');
    
    try {
      setSportsDbLinking(true);
      
      // Create SportsDB data object from manual input
      const sportsDbData = {
        teamId: `manual_${Date.now()}`, // Generate unique ID for manual entries
        teamName: editingPartner.name,
        venueCapacity: manualEntryData.venueCapacity ? parseInt(manualEntryData.venueCapacity, 10) : undefined,
        venueName: manualEntryData.venueName || undefined,
        leagueName: manualEntryData.leagueName || undefined,
        founded: manualEntryData.founded || undefined,
        country: manualEntryData.country || undefined,
        badge: manualEntryData.logoUrl || undefined,
        lastSynced: new Date().toISOString(),
      };
      
      // Upload logo to ImgBB if URL provided
      let logoUrl: string | undefined;
      if (manualEntryData.logoUrl) {
        console.log('🖼️ Uploading manually provided logo to ImgBB...');
        try {
          const imgbbData = await apiPost('/api/partners/upload-logo', {
            badgeUrl: manualEntryData.logoUrl,
            partnerName: editingPartner.name,
          });
          if (imgbbData.success && imgbbData.logoUrl) {
            logoUrl = imgbbData.logoUrl;
            console.log('✅ Logo uploaded to ImgBB:', logoUrl);
          }
        } catch (logoErr) {
          console.error('❌ Logo upload error:', logoErr);
          // Continue without logo - non-blocking error
        }
      }
      
      // Save to database
      const updateData = await apiPut('/api/partners', {
        partnerId: editingPartner._id,
        sportsDb: sportsDbData,
        logoUrl: logoUrl,
      });
      
      if (updateData.success) {
        setSuccessMessage(`✓ Successfully added manual sports data`);
        
        // Update local state
        setEditPartnerData(prev => ({
          ...prev,
          sportsDb: sportsDbData,
          logoUrl: logoUrl || prev.logoUrl
        }));
        
        // Clear manual entry form
        setShowManualEntry(false);
        setManualEntryData({
          venueName: '',
          venueCapacity: '',
          leagueName: '',
          country: '',
          founded: '',
          logoUrl: '',
        });
        
        // Reload partners list
        loadPartners();
      } else {
        setError(updateData.error || 'Failed to save manual sports data');
      }
    } catch (err) {
      setError('Network error while saving manual sports data');
      console.error('Manual entry error:', err);
    } finally {
      setSportsDbLinking(false);
    }
  };

  const openEditForm = useCallback((partner: PartnerResponse) => {
    loadBitlyLinks();
    setEditingPartner(partner);
    setEditPartnerData({
      name: partner.name,
      emoji: partner.emoji,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      bitlyLinkIds: partner.bitlyLinks?.map(link => link._id) || [],
      logoUrl: partner.logoUrl,
      sportsDb: partner.sportsDb,
      styleId: partner.styleId || '',
      reportTemplateId: partner.reportTemplateId || ''
    });
    setSportsDbSearch('');
    setSportsDbResults([]);
    setShowManualEntry(false);
    setManualEntryData({
      venueName: '',
      venueCapacity: '',
      leagueName: '',
      country: '',
      founded: '',
      logoUrl: '',
    });
    setShowEditForm(true);
  }, [loadBitlyLinks]);
  
  // WHAT: Override adapter handlers with real functions
  // WHY: Adapter has placeholder handlers - inject actual logic from page
  const partnersAdapterWithHandlers = useMemo(() => {
    return {
      ...partnersAdapter,
      listConfig: {
        ...partnersAdapter.listConfig,
        rowActions: partnersAdapter.listConfig.rowActions?.map(action => {
          if (action.label === 'Edit') {
            return {
              ...action,
              handler: (partner: PartnerResponse) => openEditForm(partner)
            };
          }
          if (action.label === 'Delete') {
            return {
              ...action,
              handler: (partner: PartnerResponse) => handleDeletePartner(partner._id, partner.name)
            };
          }
          if (action.label === 'Report') {
            return {
              ...action,
              handler: (partner: PartnerResponse) => {
                // WHAT: Open SharePopup modal with partner report URL and password
                // WHY: Allow admin to share partner report page with password
                console.log('🔍 Report clicked:', { name: partner.name, viewSlug: partner.viewSlug, partnerId: partner._id });
                if (partner.viewSlug) {
                  setSharePartnerId(partner.viewSlug);
                  setSharePopupOpen(true);
                } else {
                  alert('Partner does not have a viewSlug. Please edit and save the partner to generate one.');
                }
              }
            };
          }
          // WHAT: Return unchanged action for other buttons (KYC Data, etc.)
          // WHY: Preserve adapter-defined handlers
          return action;
        })
      },
      cardConfig: {
        ...partnersAdapter.cardConfig,
        cardActions: partnersAdapter.cardConfig.cardActions?.map(action => {
          if (action.label === 'Edit') {
            return {
              ...action,
              handler: (partner: PartnerResponse) => openEditForm(partner)
            };
          }
          if (action.label === 'Delete') {
            return {
              ...action,
              handler: (partner: PartnerResponse) => handleDeletePartner(partner._id, partner.name)
            };
          }
          if (action.label === 'Report') {
            return {
              ...action,
              handler: (partner: PartnerResponse) => {
                // WHAT: Open SharePopup modal with partner report URL and password (card view)
                // WHY: Same behavior as row actions - share modal for partner reports
                if (partner.viewSlug) {
                  setSharePartnerId(partner.viewSlug);
                  setSharePopupOpen(true);
                } else {
                  alert('Partner does not have a viewSlug. Please edit and save the partner to generate one.');
                }
              }
            };
          }
          // WHAT: Return unchanged action for other buttons (KYC Data, etc.)
          // WHY: Preserve adapter-defined handlers
          return action;
        })
      }
    };
  }, [handleDeletePartner, openEditForm]); // FIXED: partnersAdapter and partners don't need to be in deps
  
  // Loading state
  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">🤝</div>
          <div className="text-gray-600">Loading partners...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <>
      <UnifiedAdminPage
        adapter={partnersAdapterWithHandlers}
        items={partners}
        isLoading={loading}
        title="🤝 Partner Management"
        subtitle="Manage organizations that own or operate events: clubs, federations, venues, brands"
        backLink="/admin"
        actionButtons={[
          {
            label: 'Add Partner',
            onClick: () => {
              loadBitlyLinks();
              setShowAddForm(true);
            },
            variant: 'primary',
            icon: '+',
            title: 'Create a new partner organization'
          }
        ]}
        enableSearch
        externalSearchValue={searchQuery}
        onExternalSearchChange={setSearchQuery}
        searchPlaceholder="Search partners..."
        totalMatched={totalMatched}
        showPaginationStats
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
      
      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Load More Button */}
      {nextOffset !== null && partners.length > 0 && (
        <div className="load-more-wrapper">
          <button 
            className="btn btn-small btn-secondary" 
            disabled={isLoadingMore} 
            onClick={handleLoadMore}
          >
            {isLoadingMore ? 'Loading…' : 'Load 20 more'}
          </button>
        </div>
      )}
      
      {/* Add Partner Modal */}
      <FormModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddPartner}
        title="+ Add Partner"
        submitText="Create Partner"
        isSubmitting={isCreatingPartner}
        size="lg"
      >
        <div className="form-group mb-4">
          <label className="form-label-block">Partner Name *</label>
          <input
            type="text"
            className="form-input"
            value={newPartnerData.name}
            onChange={(e) => setNewPartnerData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter partner name (e.g., FC Barcelona, UEFA, Camp Nou)"
            required
            autoFocus
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Partner Emoji *</label>
          <EmojiSelector
            value={newPartnerData.emoji}
            onChange={(emoji) => setNewPartnerData(prev => ({ ...prev, emoji }))}
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">TheSportsDB</label>
          <TheSportsDBSearch
            linkedTeam={newPartnerData.sportsDb}
            onLink={(team) => {
              setNewPartnerData(prev => ({
                ...prev,
                sportsDb: team,
                logoUrl: team.strTeamBadge
              }));
            }}
            onUnlink={() => {
              setNewPartnerData(prev => ({ ...prev, sportsDb: undefined }));
            }}
          />
          <p className="form-hint">
            💡 Link to sports team for auto-populated data (logo, colors, stadium, hashtags)
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Hashtags (optional)</label>
          <UnifiedHashtagInput
            generalHashtags={newPartnerData.hashtags}
            onGeneralChange={(hashtags) => 
              setNewPartnerData(prev => ({ ...prev, hashtags }))
            }
            categorizedHashtags={newPartnerData.categorizedHashtags}
            onCategorizedChange={(categorizedHashtags) => 
              setNewPartnerData(prev => ({ ...prev, categorizedHashtags }))
            }
            placeholder="Search or add hashtags..."
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Bitly Links (optional)</label>
          <BitlyLinksSelector
            selectedLinkIds={newPartnerData.bitlyLinkIds}
            onChange={(bitlyLinkIds) => 
              setNewPartnerData(prev => ({ ...prev, bitlyLinkIds }))
            }
          />
          <p className="form-hint">
            💡 Type to search Bitly links (e.g., "fanselfie.me/swisshockey")
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Page Style</label>
          <select 
            className="form-input"
            value={newPartnerData.styleId || ''}
            onChange={(e) => setNewPartnerData(prev => ({ ...prev, styleId: e.target.value || null }))}
          >
            <option value="">— Use Default/Global —</option>
            {availableStyles.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <p className="form-hint">
            💡 Page styling (fonts, colors, gradients) for partner report page
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Report Template</label>
          <select 
            className="form-input"
            value={newPartnerData.reportTemplateId || ''}
            onChange={(e) => setNewPartnerData(prev => ({ ...prev, reportTemplateId: e.target.value }))}
          >
            <option value="">— Use Default Template —</option>
            {availableTemplates.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.type})</option>
            ))}
          </select>
          <p className="form-hint">
            💡 All events from this partner will use this template by default
          </p>
        </div>
      </FormModal>
      
      {/* Share Partner Report Modal */}
      <SharePopup
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        pageId={sharePartnerId}
        pageType="partner-report"
        customTitle="Share Partner Report"
      />
      
      {/* Edit Partner Modal */}
      <FormModal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdatePartner}
        title="Edit Partner"
        submitText="Update Partner"
        isSubmitting={isUpdatingPartner}
        size="lg"
      >
        <div className="form-group mb-4">
          <label className="form-label-block">Partner Name *</label>
          <input
            type="text"
            className="form-input"
            value={editPartnerData.name}
            onChange={(e) => setEditPartnerData(prev => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Partner Emoji *</label>
          <EmojiSelector
            value={editPartnerData.emoji}
            onChange={(emoji) => setEditPartnerData(prev => ({ ...prev, emoji }))}
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">TheSportsDB</label>
          <TheSportsDBSearch
            linkedTeam={editPartnerData.sportsDb}
            onLink={(team) => {
              setEditPartnerData(prev => ({
                ...prev,
                sportsDb: team,
                logoUrl: team.strTeamBadge || prev.logoUrl
              }));
            }}
            onUnlink={() => {
              setEditPartnerData(prev => ({ ...prev, sportsDb: undefined }));
            }}
          />
          
          {/* Manual Entry Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              className="btn btn-sm btn-secondary mb-2"
            >
              🖊️ Can't find it? Enter manually
            </button>
          </div>
          
          <p className="form-hint">
            💡 Link to sports team for auto-populated data (logo, colors, stadium, hashtags)
            <br />
            <strong>Note:</strong> TheSportsDB FREE API has limitations. If you can't find your team, use manual entry.
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Hashtags</label>
          <UnifiedHashtagInput
            generalHashtags={editPartnerData.hashtags}
            onGeneralChange={(hashtags) => 
              setEditPartnerData(prev => ({ ...prev, hashtags }))
            }
            categorizedHashtags={editPartnerData.categorizedHashtags}
            onCategorizedChange={(categorizedHashtags) => 
              setEditPartnerData(prev => ({ ...prev, categorizedHashtags }))
            }
            placeholder="Search or add hashtags..."
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Bitly Links</label>
          <BitlyLinksSelector
            selectedLinkIds={editPartnerData.bitlyLinkIds}
            onChange={(bitlyLinkIds) => 
              setEditPartnerData(prev => ({ ...prev, bitlyLinkIds }))
            }
          />
          <p className="form-hint">
            💡 Type to search Bitly links (e.g., "fanselfie.me/swisshockey")
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Page Style</label>
          <select 
            className="form-input"
            value={editPartnerData.styleId || ''}
            onChange={(e) => setEditPartnerData(prev => ({ ...prev, styleId: e.target.value || null }))}
          >
            <option value="">— Use Default/Global —</option>
            {availableStyles.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <p className="form-hint">
            💡 Page styling (fonts, colors, gradients) for partner report page
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Report Template</label>
          <select 
            className="form-input"
            value={editPartnerData.reportTemplateId || ''}
            onChange={(e) => setEditPartnerData(prev => ({ ...prev, reportTemplateId: e.target.value }))}
          >
            <option value="">— Use Default Template —</option>
            {availableTemplates.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.type})</option>
            ))}
          </select>
          <p className="form-hint">
            💡 All events from this partner will use this template by default
          </p>
        </div>
      </FormModal>
      
      {/* Manual Sports Data Entry Modal */}
      <FormModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSubmit={handleManualEntry}
        title="🖊️ Enter Sports Data Manually"
        submitText="Save Manual Data"
        isSubmitting={sportsDbLinking}
        size="lg"
      >
        <div className="form-group mb-4">
          <label className="form-label-block">Venue Name</label>
          <input
            type="text"
            className="form-input"
            value={manualEntryData.venueName}
            onChange={(e) => setManualEntryData(prev => ({ ...prev, venueName: e.target.value }))}
            placeholder="e.g., Camp Nou"
          />
        </div>

        <div className="form-group mb-4">
          <label className="form-label-block">Venue Capacity</label>
          <input
            type="number"
            className="form-input"
            value={manualEntryData.venueCapacity}
            onChange={(e) => setManualEntryData(prev => ({ ...prev, venueCapacity: e.target.value }))}
            placeholder="e.g., 99354"
          />
        </div>

        <div className="form-group mb-4">
          <label className="form-label-block">League Name</label>
          <input
            type="text"
            className="form-input"
            value={manualEntryData.leagueName}
            onChange={(e) => setManualEntryData(prev => ({ ...prev, leagueName: e.target.value }))}
            placeholder="e.g., La Liga"
          />
        </div>

        <div className="form-group mb-4">
          <label className="form-label-block">Country</label>
          <input
            type="text"
            className="form-input"
            value={manualEntryData.country}
            onChange={(e) => setManualEntryData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="e.g., Spain"
          />
        </div>

        <div className="form-group mb-4">
          <label className="form-label-block">Founded Year</label>
          <input
            type="text"
            className="form-input"
            value={manualEntryData.founded}
            onChange={(e) => setManualEntryData(prev => ({ ...prev, founded: e.target.value }))}
            placeholder="e.g., 1899"
          />
        </div>

        <div className="form-group mb-4">
          <label className="form-label-block">Logo URL</label>
          <input
            type="url"
            className="form-input"
            value={manualEntryData.logoUrl}
            onChange={(e) => setManualEntryData(prev => ({ ...prev, logoUrl: e.target.value }))}
            placeholder="https://example.com/logo.png"
          />
          <p className="form-hint">
            💡 Logo will be uploaded to ImgBB for permanent hosting
          </p>
        </div>
      </FormModal>
    </>
  );
}
