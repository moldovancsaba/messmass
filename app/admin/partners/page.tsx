'use client';

// WHAT: Refactored Partners admin page using UnifiedAdminPage + partnersAdapter
// WHY: Eliminate hardcoded table HTML, use unified system with Report button support
// MIGRATION: From hardcoded table to adapter-based system (matches /admin/events pattern)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { partnersAdapter, partnersEntityConfig } from '@/lib/adapters/partnersAdapter';
import type { PartnerResponse } from '@/lib/partner.types';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import FormModal from '@/components/modals/FormModal';
import SharePopup from '@/components/SharePopup';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import BitlyLinksSelector from '@/components/BitlyLinksSelector';
import EmojiSelector from '@/components/EmojiSelector';
import TheSportsDBSearch from '@/components/TheSportsDBSearch';
import ImageUploader from '@/components/ImageUploader';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import { withAdminEntityActions } from '@/lib/adminEntitySystem';
import { generateSportsDbHashtags, mergeSportsDbHashtags } from '@/lib/sportsDbHashtagEnricher';
import ColoredCard from '@/components/ColoredCard';

const PAGE_SIZE = 20;

const isImgBbHostedUrl = (url: string) => /imgbb\.com|i\.ibb\.co|ibb\.co/i.test(url);

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
  const [availableClickerSets, setAvailableClickerSets] = useState<{ _id: string; name: string; isDefault?: boolean }[]>([]);
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
  const [createPartnerStep, setCreatePartnerStep] = useState<1 | 2>(1);
  const [newPartnerData, setNewPartnerData] = useState({
    name: '',
    emoji: '',
    showEmoji: true, // WHAT: Default to showing emoji
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    bitlyLinkIds: [] as string[],
    styleId: '' as string | null,
    reportTemplateId: '' as string | null,
    clickerSetId: '' as string | null,
    sportsDb: undefined as any,
    logoUrl: undefined as string | undefined,
    autoProvisionGoogleSheet: false
  });
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [createPartnerResult, setCreatePartnerResult] = useState<{
    partnerId: string;
    name: string;
    viewSlug?: string | null;
    googleSheetUrl?: string | null;
    provisioningError?: string | null;
  } | null>(null);
  
  // Modal states - Edit
  const [showEditForm, setShowEditForm] = useState(false);
  const [editPartnerStep, setEditPartnerStep] = useState<1 | 2>(1);
  const [editingPartner, setEditingPartner] = useState<PartnerResponse | null>(null);
  
  // Share modal state
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePartnerId, setSharePartnerId] = useState<string>('');
  const [editPartnerData, setEditPartnerData] = useState({
    name: '',
    emoji: '',
    showEmoji: true, // WHAT: Default to showing emoji
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    bitlyLinkIds: [] as string[],
    logoUrl: undefined as string | undefined,
    sportsDb: undefined as any,
    styleId: '' as string | null,
    reportTemplateId: '' as string | null,
    clickerSetId: '' as string | null,
    googleSheetsUrl: '' as string | undefined,
    showOnlyTeam1Events: false,
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

  const resetCreatePartnerForm = useCallback(() => {
    setCreatePartnerStep(1);
    setShowAddForm(false);
    setNewPartnerData({
      name: '',
      emoji: '',
      showEmoji: true,
      hashtags: [],
      categorizedHashtags: {},
      bitlyLinkIds: [],
      styleId: '',
      reportTemplateId: '',
      clickerSetId: '',
      sportsDb: undefined,
      logoUrl: undefined,
      autoProvisionGoogleSheet: false,
    });
  }, []);

  const resetEditPartnerForm = useCallback(() => {
    setEditPartnerStep(1);
    setShowEditForm(false);
    setEditingPartner(null);
    setShowManualEntry(false);
    setEditPartnerData({
      name: '',
      emoji: '',
      showEmoji: true,
      hashtags: [],
      categorizedHashtags: {},
      bitlyLinkIds: [],
      logoUrl: undefined,
      sportsDb: undefined,
      styleId: '',
      reportTemplateId: '',
      clickerSetId: '',
      googleSheetsUrl: '',
      showOnlyTeam1Events: false,
    });
    setManualEntryData({
      venueName: '',
      venueCapacity: '',
      leagueName: '',
      country: '',
      founded: '',
      logoUrl: '',
    });
  }, []);
  
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

      // Load clicker sets
      (async () => {
        try {
          const res = await fetch('/api/clicker-sets');
          const data = await res.json();
          if (data.success) {
            setAvailableClickerSets(data.sets);
          }
        } catch (e) {
          console.error('Failed to load clicker sets', e);
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
  const handleAddPartner = useCallback(async () => {
    setError('');
    setSuccessMessage('');
    
    if (!newPartnerData.name.trim() || !newPartnerData.emoji.trim()) {
      setError('Name and emoji are required');
      return;
    }
    
    try {
      setIsCreatingPartner(true);
      const { autoProvisionGoogleSheet, ...createPayload } = newPartnerData as any;
      const data = await apiPost('/api/partners', createPayload);
      
      if (data.success) {
        setSuccessMessage(`✓ Partner "${newPartnerData.name}" created successfully!`);
        let provisionedSheetUrl: string | null = null;
        let provisioningError: string | null = null;

        // Phase 2.5: Optional auto-provisioning (create + setup + connect)
        if (autoProvisionGoogleSheet && data?.partner?._id) {
          try {
            const provision = await apiPost(`/api/partners/${data.partner._id}/google-sheet/provision`, { syncMode: 'manual' });
            if (provision?.success && provision?.sheetUrl) {
              provisionedSheetUrl = provision.sheetUrl;
            } else {
              provisioningError = provision?.error || 'Unknown error';
            }
          } catch (e) {
            provisioningError = e instanceof Error ? e.message : 'Unknown error';
          }
        }

        setCreatePartnerResult({
          partnerId: data.partner._id,
          name: data.partner.name || newPartnerData.name,
          viewSlug: data.partner.viewSlug || null,
          googleSheetUrl: provisionedSheetUrl,
          provisioningError,
        });
        resetCreatePartnerForm();
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
  }, [loadPartners, newPartnerData, resetCreatePartnerForm]);

  const handleAddPartnerSubmit = useCallback(async () => {
    setError('');
    if (createPartnerStep === 1) {
      if (!newPartnerData.name.trim() || !newPartnerData.emoji.trim()) {
        setError('Name and emoji are required');
        return;
      }
      setCreatePartnerStep(2);
      return;
    }

    await handleAddPartner();
  }, [createPartnerStep, handleAddPartner, newPartnerData.emoji, newPartnerData.name]);
  
  // WHAT: Handle updating an existing partner
  // WHY: Allows editing partner details
  const handleUpdatePartner = useCallback(async () => {
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
        resetEditPartnerForm();
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
  }, [editPartnerData, editingPartner, loadPartners, resetEditPartnerForm]);

  const handleUpdatePartnerSubmit = useCallback(async () => {
    setError('');
    if (editPartnerStep === 1) {
      if (!editingPartner || !editPartnerData.name.trim() || !editPartnerData.emoji.trim()) {
        setError('Name and emoji are required');
        return;
      }
      setEditPartnerStep(2);
      return;
    }

    await handleUpdatePartner();
  }, [editPartnerData.emoji, editPartnerData.name, editPartnerStep, editingPartner, handleUpdatePartner]);
  
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
      let finalLogoUrl = manualEntryData.logoUrl || undefined;

      if (manualEntryData.logoUrl && !isImgBbHostedUrl(manualEntryData.logoUrl)) {
        console.log('🖼️ Uploading manually provided logo to ImgBB...');
        try {
          const imgbbData = await apiPost('/api/partners/upload-logo', {
            badgeUrl: manualEntryData.logoUrl,
            partnerName: editingPartner.name,
          });
          if (imgbbData.success && imgbbData.logoUrl) {
            finalLogoUrl = imgbbData.logoUrl;
            console.log('✅ Logo uploaded to ImgBB:', finalLogoUrl);
          }
        } catch (logoErr) {
          console.error('❌ Logo upload error:', logoErr);
          // Continue without blocking the rest of the manual save
        }
      }

      const sportsDbData = {
        teamId: `manual_${Date.now()}`, // Generate unique ID for manual entries
        teamName: editingPartner.name,
        venueCapacity: manualEntryData.venueCapacity ? parseInt(manualEntryData.venueCapacity, 10) : undefined,
        venueName: manualEntryData.venueName || undefined,
        leagueName: manualEntryData.leagueName || undefined,
        founded: manualEntryData.founded || undefined,
        country: manualEntryData.country || undefined,
        badge: finalLogoUrl,
        lastSynced: new Date().toISOString(),
      };
      
      // Save to database
      const updateData = await apiPut('/api/partners', {
        partnerId: editingPartner._id,
        sportsDb: sportsDbData,
        logoUrl: finalLogoUrl,
      });
      
      if (updateData.success) {
        setSuccessMessage(`✓ Successfully added manual sports data`);
        
        // Update local state
        setEditPartnerData(prev => ({
          ...prev,
          sportsDb: sportsDbData,
          logoUrl: finalLogoUrl || prev.logoUrl
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
    setEditPartnerStep(1);
    setEditingPartner(partner);
    setEditPartnerData({
      name: partner.name,
      emoji: partner.emoji,
      showEmoji: partner.showEmoji ?? true, // WHAT: Default to true if not set
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      bitlyLinkIds: partner.bitlyLinks?.map(link => link._id) || [],
      logoUrl: partner.logoUrl,
      sportsDb: partner.sportsDb,
      styleId: partner.styleId || '',
      reportTemplateId: partner.reportTemplateId || '',
      clickerSetId: (partner as any).clickerSetId || '',
      googleSheetsUrl: partner.googleSheetsUrl || '',
      showOnlyTeam1Events: partner.showOnlyTeam1Events ?? false,
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

  const renderPartnerStepHeader = (currentStep: 1 | 2, labels: [string, string]) => (
    <div className="form-group mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {labels.map((label, index) => {
          const stepNumber = (index + 1) as 1 | 2;
          return (
            <span
              key={label}
              className={`badge ${currentStep === stepNumber ? 'badge-primary' : 'badge-secondary'}`}
            >
              {stepNumber}. {label}
            </span>
          );
        })}
      </div>
      <p className="form-hint mt-2">
        {currentStep === 1
          ? 'Start with partner identity, display rules, sports enrichment, and hashtags.'
          : 'Then configure reporting defaults, distribution links, clicker layout, and Google Sheets behavior.'}
      </p>
    </div>
  );

  const createPartnerFooter = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={`badge ${createPartnerStep === 1 ? 'badge-primary' : 'badge-secondary'}`}>Basics</span>
        <span className={`badge ${createPartnerStep === 2 ? 'badge-primary' : 'badge-secondary'}`}>Reporting</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (createPartnerStep === 1) {
              resetCreatePartnerForm();
              return;
            }
            setCreatePartnerStep(1);
          }}
          disabled={isCreatingPartner}
          className="btn btn-small btn-secondary"
        >
          {createPartnerStep === 1 ? 'Cancel' : 'Back'}
        </button>
        <button type="submit" disabled={isCreatingPartner} className="btn btn-small btn-primary">
          {isCreatingPartner ? 'Saving…' : createPartnerStep === 1 ? 'Continue to Reporting' : 'Create Partner'}
        </button>
      </div>
    </div>
  );

  const editPartnerFooter = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={`badge ${editPartnerStep === 1 ? 'badge-primary' : 'badge-secondary'}`}>Basics</span>
        <span className={`badge ${editPartnerStep === 2 ? 'badge-primary' : 'badge-secondary'}`}>Reporting</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (editPartnerStep === 1) {
              resetEditPartnerForm();
              return;
            }
            setEditPartnerStep(1);
          }}
          disabled={isUpdatingPartner}
          className="btn btn-small btn-secondary"
        >
          {editPartnerStep === 1 ? 'Cancel' : 'Back'}
        </button>
        <button type="submit" disabled={isUpdatingPartner} className="btn btn-small btn-primary">
          {isUpdatingPartner ? 'Saving…' : editPartnerStep === 1 ? 'Continue to Reporting' : 'Update Partner'}
        </button>
      </div>
    </div>
  );
  
  const partnersAdapterWithHandlers = useMemo(() => withAdminEntityActions(
    partnersAdapter,
    partnersEntityConfig,
    {
      user,
      openModal: (modalKey, partner) => {
        if (modalKey === 'edit-partner') {
          openEditForm(partner);
        }
      },
      openShare: (shareKey, resourceId) => {
        if (shareKey === 'partner-report') {
          setSharePartnerId(resourceId);
          setSharePopupOpen(true);
        }
      },
      runMutation: (mutationKey, partner) => {
        if (mutationKey === 'delete-partner') {
          void handleDeletePartner(partner._id, partner.name);
        }
      },
    }
  ), [handleDeletePartner, openEditForm, user]);
  
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

      {createPartnerResult && (
        <div className="mb-4">
          <ColoredCard accentColor="var(--mm-color-success-500, #16a34a)" hoverable={false}>
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="m-0 text-lg font-semibold">Partner created: {createPartnerResult.name}</h3>
                <p className="form-hint mt-2 mb-0">
                  The partner record is ready. Continue directly into the next operational surface instead of reopening the admin flow manually.
                </p>
                {createPartnerResult.provisioningError && (
                  <p className="form-hint mt-2 mb-0">
                    Google Sheets provisioning needs follow-up: {createPartnerResult.provisioningError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {createPartnerResult.viewSlug && (
                  <Link href={`/partner-edit/${createPartnerResult.viewSlug}`} className="btn btn-small btn-primary">
                    Open Editor
                  </Link>
                )}
                {createPartnerResult.viewSlug && (
                  <Link href={`/partner-report/${createPartnerResult.viewSlug}`} className="btn btn-small btn-secondary">
                    Open Partner Report
                  </Link>
                )}
                <Link href={`/admin/partners/${createPartnerResult.partnerId}/analytics`} className="btn btn-small btn-secondary">
                  Open Analytics
                </Link>
                {createPartnerResult.googleSheetUrl && (
                  <a href={createPartnerResult.googleSheetUrl} className="btn btn-small btn-secondary" target="_blank" rel="noreferrer">
                    Open Google Sheet
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => setCreatePartnerResult(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </ColoredCard>
        </div>
      )}
      
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
        onClose={resetCreatePartnerForm}
        onSubmit={handleAddPartnerSubmit}
        title={createPartnerStep === 1 ? '+ Add Partner: Basics' : '+ Add Partner: Reporting Setup'}
        submitText={createPartnerStep === 1 ? 'Continue to Reporting' : 'Create Partner'}
        isSubmitting={isCreatingPartner}
        size="lg"
        subtitle={createPartnerStep === 1 ? 'Define the partner entity first.' : 'Assign default reporting and integration behavior.'}
        showStatusIndicator={false}
        customFooter={createPartnerFooter}
      >
        {renderPartnerStepHeader(createPartnerStep, ['Partner Basics', 'Reporting & Integrations'])}

        {createPartnerStep === 1 ? (
          <>
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
              <label className="form-label-block">
                <input
                  type="checkbox"
                  checked={newPartnerData.showEmoji}
                  onChange={(e) => setNewPartnerData(prev => ({ ...prev, showEmoji: e.target.checked }))}
                  className="mr-2"
                />
                Show emoji in reports and displays
              </label>
              <p className="form-hint">
                💡 Uncheck to hide the emoji while keeping it stored for future use
              </p>
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
          </>
        ) : (
          <>
            <div className="form-group mb-4">
              <label className="form-label-block">Bitly Links (optional)</label>
              <BitlyLinksSelector
                selectedLinkIds={newPartnerData.bitlyLinkIds}
                onChange={(bitlyLinkIds) => 
                  setNewPartnerData(prev => ({ ...prev, bitlyLinkIds }))
                }
              />
              <p className="form-hint">
                💡 Type to search Bitly links (e.g., &quot;fanselfie.me/swisshockey&quot;)
              </p>
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label-block">Report Visual Style</label>
              <select 
                className="form-input"
                value={newPartnerData.styleId || ''}
                onChange={(e) => setNewPartnerData(prev => ({ ...prev, styleId: e.target.value || null }))}
              >
                <option value="">— Use Default Style —</option>
                {availableStyles.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <p className="form-hint">
                💡 Report color theme (26-color system) for partner report page
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

            <div className="form-group mb-4">
              <label className="form-label-block">Clicker Set</label>
              <select
                className="form-input"
                value={newPartnerData.clickerSetId || ''}
                onChange={(e) => setNewPartnerData(prev => ({ ...prev, clickerSetId: e.target.value || null }))}
              >
                <option value="">— Use Default Clicker —</option>
                {availableClickerSets.map(set => (
                  <option key={set._id} value={set._id}>
                    {set.isDefault ? '⭐ ' : ''}{set.name}
                  </option>
                ))}
              </select>
              <p className="form-hint">Select which clicker layout this partner should use by default.</p>
            </div>

            <div className="form-group mb-2">
              <label className="form-label-block">
                <input
                  type="checkbox"
                  checked={newPartnerData.autoProvisionGoogleSheet}
                  onChange={(e) => setNewPartnerData(prev => ({ ...prev, autoProvisionGoogleSheet: e.target.checked }))}
                  className="mr-2"
                />
                Auto-create + connect Google Sheet for this partner
              </label>
              <p className="form-hint">
                💡 Phase 2.5: Creates a new sheet, writes headers, and connects it automatically. You still need to share the sheet with the partner&apos;s editors.
              </p>
            </div>
          </>
        )}
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
        onClose={resetEditPartnerForm}
        onSubmit={handleUpdatePartnerSubmit}
        title={editPartnerStep === 1 ? 'Edit Partner: Basics' : 'Edit Partner: Reporting & Integrations'}
        submitText={editPartnerStep === 1 ? 'Continue to Reporting' : 'Update Partner'}
        isSubmitting={isUpdatingPartner}
        size="lg"
        subtitle={editPartnerStep === 1 ? 'Validate the partner record first.' : 'Then adjust reporting defaults and connected workflows.'}
        showStatusIndicator={false}
        customFooter={editPartnerFooter}
      >
        {renderPartnerStepHeader(editPartnerStep, ['Partner Basics', 'Reporting & Integrations'])}

        {editPartnerStep === 1 ? (
          <>
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
        
        {/* WHAT: Read-only Partner UUID field
            WHY: Editors need a stable reference to share/identify partners across tools (e.g., Sheets/analytics)
            HOW: Display MongoDB ObjectId from editingPartner._id, non-editable to avoid accidental changes */}
        <div className="form-group mb-4">
          <label className="form-label-block">Partner UUID</label>
          <input
            type="text"
            className="form-input"
            value={editingPartner?._id || ''}
            readOnly
            disabled
          />
          <p className="form-hint">Auto-generated at creation; read-only identifier.</p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Partner Emoji *</label>
          <EmojiSelector
            value={editPartnerData.emoji}
            onChange={(emoji) => setEditPartnerData(prev => ({ ...prev, emoji }))}
          />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">
            <input
              type="checkbox"
              checked={editPartnerData.showEmoji}
              onChange={(e) => setEditPartnerData(prev => ({ ...prev, showEmoji: e.target.checked }))}
              className="mr-2"
            />
            Show emoji in reports and displays
          </label>
          <p className="form-hint">
            💡 Uncheck to hide the emoji while keeping it stored for future use
          </p>
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
              🖊️ Can&apos;t find it? Enter manually
            </button>
          </div>
          
          <p className="form-hint">
            💡 Link to sports team for auto-populated data (logo, colors, stadium, hashtags)
            <br />
            <strong>Note:</strong> TheSportsDB FREE API has limitations. If you can&apos;t find your team, use manual entry.
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
          </>
        ) : (
          <>
        <div className="form-group mb-4">
          <label className="form-label-block">Bitly Links</label>
          <BitlyLinksSelector
            selectedLinkIds={editPartnerData.bitlyLinkIds}
            onChange={(bitlyLinkIds) => 
              setEditPartnerData(prev => ({ ...prev, bitlyLinkIds }))
            }
          />
          <p className="form-hint">
            💡 Type to search Bitly links (e.g., &quot;fanselfie.me/swisshockey&quot;)
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Report Visual Style</label>
          <select 
            className="form-input"
            value={editPartnerData.styleId || ''}
            onChange={(e) => setEditPartnerData(prev => ({ ...prev, styleId: e.target.value || null }))}
          >
            <option value="">— Use Default Style —</option>
            {availableStyles.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <p className="form-hint">
            💡 Report color theme (26-color system) for partner report page
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

        <div className="form-group mb-4">
          <label className="form-label-block">
            <input
              type="checkbox"
              checked={editPartnerData.showOnlyTeam1Events}
              onChange={(e) => setEditPartnerData(prev => ({ ...prev, showOnlyTeam1Events: e.target.checked }))}
              className="mr-2"
            />
            Only Include Local/Home Events (Team 1)
          </label>
          <p className="form-hint">
            💡 When enabled, this partner&apos;s report only aggregates and lists events where the partner is Team 1 / the local-home side.
          </p>
        </div>

        <div className="form-group mb-4">
          <label className="form-label-block">Clicker Set</label>
          <select
            className="form-input"
            value={editPartnerData.clickerSetId || ''}
            onChange={(e) => setEditPartnerData(prev => ({ ...prev, clickerSetId: e.target.value || null }))}
          >
            <option value="">— Use Default Clicker —</option>
            {availableClickerSets.map(set => (
              <option key={set._id} value={set._id}>
                {set.isDefault ? '⭐ ' : ''}{set.name}
              </option>
            ))}
          </select>
          <p className="form-hint">Select which clicker layout this partner should use by default.</p>
        </div>

        {/* Google Sheets Integration (inline in Edit modal) */}
        <div className="form-group mb-4">
          <label className="form-label-block">Google Sheet URL or ID</label>
          <input
            type="text"
            className="form-input"
            value={editPartnerData.googleSheetsUrl || ''}
            onChange={(e) => {
              const url = e.target.value;
              setEditPartnerData(prev => ({ ...prev, googleSheetsUrl: url }));
            }}
            placeholder="https://docs.google.com/spreadsheets/d/... or just the Sheet ID"
          />
          <p className="form-hint">Store the canonical sheet URL here for reference and auto-connect.</p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={async (event) => {
              try {
                // Show loading state
                const btn = event?.target as HTMLButtonElement;
                const originalText = btn?.textContent || '';
                if (btn) btn.textContent = '⏳ Creating...';
                if (btn) btn.disabled = true;

                const data = await apiPost(`/api/partners/${(editingPartner as any)?._id}/google-sheet/provision`, { syncMode: 'manual' });
                if (!data.success) {
                  alert(data.error || 'Provision failed');
                  return;
                }

                setEditPartnerData(prev => ({ ...prev, googleSheetsUrl: data.sheetUrl }));
                alert(`✅ Created + connected Google Sheet:\n\n${data.sheetUrl}\n\nNext: open the sheet and share it with the partner's editors.`);
              } catch (e) {
                alert('Provision failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
              } finally {
                const btn = event?.target as HTMLButtonElement;
                if (btn) btn.disabled = false;
                if (btn) btn.textContent = '🆕 Create & Connect New Google Sheet';
              }
            }}
          >
            🆕 Create & Connect New Google Sheet
          </button>
        </div>

        {/* Inline Connect + Pull/Push */}
          </>
        )}
        <div className="form-group mb-4">
          <button
            type="button"
            className="btn btn-secondary mr-2"
            onClick={async () => {
              try {
                const raw = editPartnerData.googleSheetsUrl || '';
                const m = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);
                const sheetId = m ? m[1] : (/^[a-zA-Z0-9-_]+$/.test(raw) ? raw : '');
                if (!sheetId) {
                  alert('Please enter a valid Google Sheets URL or ID first.');
                  return;
                }
                
                // Show loading state
                const btn = event?.target as HTMLButtonElement;
                const originalText = btn?.textContent || '';
                if (btn) btn.textContent = '⏳ Setting up...';
                if (btn) btn.disabled = true;
                
                try {
                  // Step 1: Auto-setup the sheet (rename Sheet1, add columns, populate data, prefix UUID)
                  // WHAT: Use apiPost() for automatic CSRF token handling
                  // WHY: Production middleware requires X-CSRF-Token header for POST requests
                  const setupData = await apiPost(`/api/partners/${(editingPartner as any)?._id}/google-sheet/setup`, { sheetId });
                  
                  if (!setupData.success) {
                    alert(`Setup failed: ${setupData.error || 'Unknown error'}`);
                    return;
                  }
                  
                  // Step 2: Connect the sheet (save config to partner document)
                  // WHAT: Use apiPost() for automatic CSRF token handling
                  // WHY: Production middleware requires X-CSRF-Token header for POST requests
                  const connectData = await apiPost(`/api/partners/${(editingPartner as any)?._id}/google-sheet/connect`, {
                    sheetId,
                    sheetName: 'Events',
                    syncMode: 'manual'
                  });
                  
                  if (!connectData.success) {
                    alert(`Connection failed: ${connectData.error || 'Unknown error'}`);
                    return;
                  }
                  
                  alert(`✅ Google Sheet connected and populated!\n\n📊 ${setupData.eventsWritten || 0} events added\n🏷️  Sheet renamed with UUID prefix`);
                } finally {
                  if (btn) btn.textContent = originalText;
                  if (btn) btn.disabled = false;
                }
              } catch (e) {
                alert('Failed to connect sheet: ' + (e instanceof Error ? e.message : 'Unknown error'));
              }
            }}
          >
            ✅ Connect & Setup Google Sheet
          </button>

          {/* Pull / Push buttons */}
          {(editingPartner as any)?._id && (
            <span className="inline-flex gap-2 align-middle ml-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  // WHAT: Use apiPost() for automatic CSRF token handling
                  // WHY: Production middleware requires X-CSRF-Token header for POST requests
                  const data = await apiPost(`/api/partners/${(editingPartner as any)?._id}/google-sheet/pull`, { dryRun: false });
                  if (!data.success) alert(data.error || 'Pull failed'); else alert(`Sheet → Mess: created ${data.summary.eventsCreated}, updated ${data.summary.eventsUpdated}`);
                }}
              >📥 Sheet → Mess</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  // WHAT: Use apiPost() for automatic CSRF token handling
                  // WHY: Production middleware requires X-CSRF-Token header for POST requests
                  const data = await apiPost(`/api/partners/${(editingPartner as any)?._id}/google-sheet/push`, { dryRun: false });
                  if (!data.success) alert(data.error || 'Push failed'); else alert(`Mess → Sheet: created ${data.summary.rowsCreated}, updated ${data.summary.rowsUpdated}`);
                }}
              >📤 Mess → Sheet</button>
            </span>
          )}
        </div>

        {/* One-click: Prefix UUID to Sheet Title */}
        <div className="form-group mb-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              try {
                const data = await apiPost(`/api/partners/${(editingPartner as any)?._id}/google-sheet/rename`, {});
                if (!data.success) alert(data.error || 'Rename failed');
                else alert(`Renamed to: ${data.name}`);
              } catch (err: any) {
                alert(err.message || 'Rename failed');
              }
            }}
          >
            🏷️ Prefix UUID in Sheet Title
          </button>
          <p className="form-hint">Adds the partner UUID to the beginning of the spreadsheet title.</p>
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
            Paste an existing image URL or upload a logo file below.
          </p>
          <div className="mt-3">
            <ImageUploader
              label="Upload Logo File"
              value={manualEntryData.logoUrl || undefined}
              onChange={(url) => setManualEntryData(prev => ({ ...prev, logoUrl: url || '' }))}
              maxSizeMB={10}
            />
          </div>
          <p className="form-hint mt-2">
            Uploaded files are stored on ImgBB and the hosted URL is saved back into the system.
          </p>
        </div>
      </FormModal>
    </>
  );
}
