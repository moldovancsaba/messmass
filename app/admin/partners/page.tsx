// app/admin/partners/page.tsx
// WHAT: Admin interface for managing partners (organizations that own/operate events)
// WHY: Centralized management for clubs, federations, venues, brands
// DESIGN SYSTEM: Uses AdminHero, modal pattern, standardized table layout matching /admin/projects

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminHero from '@/components/AdminHero';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import BitlyLinksSelector from '@/components/BitlyLinksSelector';
import type { PartnerResponse } from '@/lib/partner.types';
import { generateSportsDbHashtags, mergeSportsDbHashtags } from '@/lib/sportsDbHashtagEnricher';
import { countryToFlag } from '@/lib/countryToFlag';
import styles from './PartnerManager.module.css';
import logoStyles from '../projects/PartnerLogos.module.css';

// WHAT: Bitly link option for multi-select
interface BitlyLinkOption {
  _id: string;
  bitlink: string;
  title: string;
  long_url: string;
}

export default function PartnersAdminPage() {
  // WHAT: Component state management
  // WHY: Tracks partners, UI state, and user inputs
  const router = useRouter();
  const searchParams = useSearchParams();
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [allBitlyLinks, setAllBitlyLinks] = useState<BitlyLinkOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // WHAT: Pagination state following /admin/projects pattern
  // WHY: Handle potentially large partner databases efficiently
  const [totalMatched, setTotalMatched] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const PAGE_SIZE = 20;
  
  // WHAT: Search state with debouncing
  // WHY: Allow users to filter partners by name or hashtags
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // WHAT: Sorting state
  // WHY: Enable user-controlled table sorting
  type SortField = 'name' | 'createdAt' | 'updatedAt' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // WHAT: Form states for add/edit modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // WHAT: Form data for new partner
  const [newPartnerData, setNewPartnerData] = useState({
    name: '',
    emoji: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    bitlyLinkIds: [] as string[],
  });
  
  // WHAT: Form data for editing partner
  const [editPartnerData, setEditPartnerData] = useState({
    name: '',
    emoji: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    bitlyLinkIds: [] as string[],
    logoUrl: undefined as string | undefined,
    sportsDb: undefined as any,
  });
  
  // WHAT: SportsDB search state
  // WHY: Track team search and linking status
  const [sportsDbSearch, setSportsDbSearch] = useState('');
  const [sportsDbResults, setSportsDbResults] = useState<any[]>([]);
  const [sportsDbSearching, setSportsDbSearching] = useState(false);
  const [sportsDbLinking, setSportsDbLinking] = useState(false);
  
  // WHAT: Manual SportsDB entry state
  // WHY: Allow manual override when API doesn't have team or returns wrong data
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    venueName: '',
    venueCapacity: '',
    leagueName: '',
    country: '',
    founded: '',
    logoUrl: '',
  });

  // WHAT: Debounce search input (300ms delay)
  // WHY: Reduce API calls while user types
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // WHAT: Hydrate sort state from URL (if present)
  // WHY: Allow shareable sorted views via URL parameters
  useEffect(() => {
    const sf = searchParams?.get('sortField') as SortField | null;
    const so = searchParams?.get('sortOrder') as SortOrder | null;
    const allowedFields: SortField[] = ['name', 'createdAt', 'updatedAt'];
    const allowedOrders: SortOrder[] = ['asc', 'desc'];
    if (sf && allowedFields.includes(sf)) setSortField(sf);
    if (so && allowedOrders.includes(so)) setSortOrder(so);
  }, [searchParams]);

  // WHAT: Load first page when search/sort changes
  // WHY: Fresh search or sort requires restarting pagination
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, sortField, sortOrder]);

  // WHAT: Lazy load Bitly links only when needed
  // WHY: Fetching 3000+ links on page load is slow - only load when opening modals
  async function loadBitlyLinks() {
    if (allBitlyLinks.length > 0) return; // Already loaded
    
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
  }

  // WHAT: Load first page of partners with search and sorting
  // WHY: Start fresh pagination when search/sort changes
  async function loadData() {
    try {
      setLoading(true);
      setError('');
      setPartners([]); // Clear existing partners

      // WHAT: Build partners API URL with pagination, search, and sorting
      // WHY: Load only 20 partners at a time for performance
      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', '0');
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }
      
      // WHAT: Fetch first page of partners
      const partnersRes = await fetch(`/api/partners?${params.toString()}`);
      const partnersData = await partnersRes.json();

      if (partnersData.success && partnersData.partners) {
        setPartners(partnersData.partners);
        setTotalMatched(partnersData.pagination.total);
        setNextOffset(partnersData.pagination.hasMore ? PAGE_SIZE : null);
      }
    } catch (err) {
      setError('Failed to load data. Please refresh the page.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // WHAT: Load more partners (pagination)
  // WHY: "Load 20 more" button functionality
  async function loadMore() {
    if (nextOffset === null || loadingMore) return;

    try {
      setLoadingMore(true);
      setError('');

      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', nextOffset.toString());
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }

      const res = await fetch(`/api/partners?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.partners) {
        setPartners(prev => [...prev, ...data.partners]);
        setNextOffset(data.pagination.hasMore ? nextOffset + PAGE_SIZE : null);
      }
    } catch (err) {
      setError('Failed to load more partners.');
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  // WHAT: Handle sorting column click
  // WHY: Three-state cycle per column: asc → desc → clear
  function handleSort(field: SortField) {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    
    // WHAT: Sync to URL query for shareable state
    const params = new URLSearchParams(Array.from(searchParams?.entries() || []));
    const currentField = sortField;
    const currentOrder = sortOrder;
    let nextField: SortField = field;
    let nextOrder: SortOrder = 'asc';
    if (currentField === field) {
      nextOrder = currentOrder === 'asc' ? 'desc' : currentOrder === 'desc' ? null : 'asc';
    }
    if (nextOrder) {
      params.set('sortField', nextField as string);
      params.set('sortOrder', nextOrder);
    } else {
      params.delete('sortField');
      params.delete('sortOrder');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // WHAT: Handle adding a new partner
  // WHY: Allows creation of organization entities
  async function handleAddPartner(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPartnerData.name.trim() || !newPartnerData.emoji.trim()) {
      setError('Name and emoji are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartnerData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Partner "${newPartnerData.name}" created successfully!`);
        setShowAddForm(false);
        setNewPartnerData({
          name: '',
          emoji: '',
          hashtags: [],
          categorizedHashtags: {},
          bitlyLinkIds: [],
        });
        loadData(); // Reload to show new partner
      } else {
        setError(data.error || 'Failed to create partner');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Add partner error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // WHAT: Calculate simple string similarity for fuzzy matching
  // WHY: Handle typos like "Alaborg" -> "Aalborg"
  // RETURNS: Similarity score 0-1 (higher = more similar)
  function stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Contains match (substring)
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Levenshtein distance approximation (character overlap)
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return matches / longer.length;
  }
  
  // WHAT: Search TheSportsDB for teams by name OR by pasted team URL
  // WHY: Allow direct linking when user provides a team profile URL (e.g., https://www.thesportsdb.com/team/134003-fehérvár)
  // NOTE: Free API tier has limitations - may not return all teams the website shows
  async function searchSportsDbTeams() {
    if (!sportsDbSearch.trim()) return;

    try {
      setSportsDbSearching(true);

      // WHAT: Detect TheSportsDB team URL and extract ID
      const urlMatch = sportsDbSearch.match(/thesportsdb\.com\/team\/(\d+)/i);
      if (urlMatch && urlMatch[1]) {
        const teamIdFromUrl = urlMatch[1];
        console.log('🔎 Detected TheSportsDB team URL. Extracted ID:', teamIdFromUrl);

        // Fetch exact team by ID via lookup
        const lookupRes = await fetch(`/api/sports-db/lookup?type=team&id=${teamIdFromUrl}`);
        const lookupData = await lookupRes.json();
        console.log('Lookup response for URL ID:', lookupData);

        if (lookupData.success && lookupData.result) {
          const team = lookupData.result;
          // Validate that returned ID matches extracted ID
          if (team.idTeam !== teamIdFromUrl) {
            setError(`TheSportsDB returned a different team (got ${team.idTeam}). Please try manual entry.`);
            setSportsDbResults([]);
          } else {
            // Show only this exact team as the sole result
            setSportsDbResults([team]);
            setError('');
          }
        } else {
          setError(lookupData.error || 'Failed to fetch team from TheSportsDB by URL');
          setSportsDbResults([]);
        }
        return; // Done handling URL flow
      }

      // Fallback: normal name search
      const params = new URLSearchParams();
      params.set('type', 'team');
      params.set('query', sportsDbSearch);

      const res = await fetch(`/api/sports-db/search?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.results) {
        // WHAT: Show all API results without client-side filtering
        // WHY: TheSportsDB API search is already good, filtering removes valid results
        // EXAMPLE: "zagreb" finds "Dinamo Zagreb", "Cedevita Zagreb", etc.
        const searchLower = sportsDbSearch.toLowerCase();
        
        // WHAT: Sort by relevance (best matches first)
        // WHY: Teams with search term at start appear first
        const sorted = [...data.results].sort((a: any, b: any) => {
          const nameA = a.strTeam.toLowerCase();
          const nameB = b.strTeam.toLowerCase();
          
          // Exact match first
          if (nameA === searchLower) return -1;
          if (nameB === searchLower) return 1;
          
          // Starts with search term
          const startsA = nameA.startsWith(searchLower);
          const startsB = nameB.startsWith(searchLower);
          if (startsA && !startsB) return -1;
          if (startsB && !startsA) return 1;
          
          // Contains search term (all results should match this)
          return 0;
        });
        
        console.log(`🔍 Search results: ${data.results.length} teams found for "${sportsDbSearch}"`);
        setSportsDbResults(sorted);
      } else {
        setError(data.error || 'Failed to search TheSportsDB');
        setSportsDbResults([]);
      }
    } catch (err) {
      setError('Network error while searching TheSportsDB');
      console.error('SportsDB search error:', err);
      setSportsDbResults([]);
    } finally {
      setSportsDbSearching(false);
    }
  }

  // WHAT: Link partner to TheSportsDB team and fetch enriched data
  // WHY: Store stadium capacity, league info, badges for chart benchmarking
  // PARAMS: teamId - TheSportsDB team ID, teamData - optional team data from search (bypasses lookup API)
  async function linkToSportsDbTeam(teamId: string, teamData?: any) {
    console.log('🔗 === LINK TO SPORTSDB STARTED ===');
    console.log('Team ID:', teamId);
    console.log('Team Data Provided:', teamData ? 'Yes (from search)' : 'No (will use lookup API)');
    console.log('Editing Partner:', editingPartner);
    
    if (!editingPartner) {
      console.error('❌ No partner being edited!');
      return;
    }

    // WHAT: Confirm replacement if partner already has SportsDB data
    // WHY: Prevent accidental overwrites of existing links
    if (editPartnerData.sportsDb?.teamId) {
      console.log('⚠️ Partner already has SportsDB link, asking for confirmation...');
      if (!confirm('This partner is already linked to a team. Replace the existing link?')) {
        console.log('❌ User cancelled replacement');
        return;
      }
      console.log('✅ User confirmed replacement');
    }

    try {
      console.log('🔄 Setting linking state to true...');
      setSportsDbLinking(true);
      setError('');

      let team: any;
      
      // WHAT: Use provided team data or fetch from lookup API
      // WHY: Search data is reliable, lookup API has bugs (returns wrong teams)
      if (teamData) {
        console.log('✅ Using team data from search results (bypassing lookup API)');
        team = teamData;
      } else {
        // WHAT: Fetch full team details from TheSportsDB API
        // WHY: Fallback for re-sync or when team data not provided
        console.log('🔍 Fetching team details from TheSportsDB lookup API...');
        const lookupRes = await fetch(`/api/sports-db/lookup?type=team&id=${teamId}`);
        console.log('API Response Status:', lookupRes.status);
        
        const lookupData = await lookupRes.json();
        console.log('API Response Data:', lookupData);

        if (!lookupData.success || !lookupData.result) {
          console.error('❌ Failed to fetch team details:', lookupData.error);
          setError('Failed to fetch team details from TheSportsDB');
          return;
        }

        team = lookupData.result;
        console.log('✅ Team details received from lookup:', team.strTeam);
        
        // WHAT: Validate that returned team ID matches requested ID
        // WHY: TheSportsDB lookup API sometimes returns wrong team (known bug)
        if (team.idTeam !== teamId) {
          console.error(`❌ TheSportsDB API returned wrong team! Requested: ${teamId}, Got: ${team.idTeam}`);
          setError(`TheSportsDB API error: Requested team ${teamId} but received ${team.strTeam} (${team.idTeam}). This team cannot be linked due to API issues.`);
          return;
        }
      }

      // WHAT: Build comprehensive SportsDB enrichment object with ALL available fields
      // WHY: Store complete team profile for KYC and future analytics
      const sportsDbData = {
        // Core Identifiers
        teamId: team.idTeam,
        strTeam: team.strTeam,
        strTeamShort: team.strTeamShort,
        strAlternate: team.strAlternate,
        
        // Sport & League
        strSport: team.strSport,
        strLeague: team.strLeague,
        leagueId: team.idLeague,
        
        // Venue/Stadium
        strStadium: team.strStadium,
        venueId: team.idVenue,
        intStadiumCapacity: team.intStadiumCapacity ? parseInt(team.intStadiumCapacity, 10) : undefined,
        strStadiumThumb: team.strStadiumThumb,
        strStadiumDescription: team.strStadiumDescription,
        strStadiumLocation: team.strStadiumLocation,
        
        // Team Details
        intFormedYear: team.intFormedYear,
        strCountry: team.strCountry,
        strDescriptionEN: team.strDescriptionEN,
        
        // Visual Assets
        strTeamBadge: team.strBadge,
        strTeamLogo: team.strTeamLogo,
        strTeamJersey: team.strTeamJersey,
        strTeamBanner: team.strTeamBanner,
        strTeamFanart1: team.strTeamFanart1,
        strTeamFanart2: team.strTeamFanart2,
        strTeamFanart3: team.strTeamFanart3,
        strTeamFanart4: team.strTeamFanart4,
        
        // Social Media & Web
        strWebsite: team.strWebsite,
        strFacebook: team.strFacebook,
        strTwitter: team.strTwitter,
        strInstagram: team.strInstagram,
        
        // Sync Metadata
        lastSynced: new Date().toISOString(),
        
        // Legacy fields (backward compatibility)
        leagueName: team.strLeague,
        venueName: team.strStadium,
        venueCapacity: team.intStadiumCapacity ? parseInt(team.intStadiumCapacity, 10) : undefined,
        founded: team.intFormedYear,
        country: team.strCountry,
        website: team.strWebsite,
        badge: team.strBadge,
      };
      
      // WHAT: Auto-generate categorized hashtags from team data
      // WHY: Enrich partner with sport, league, and location hashtags for filtering
      console.log('🏷️ Generating hashtags from SportsDB team data...');
      const generatedHashtags = generateSportsDbHashtags(team);
      console.log('Generated hashtags:', generatedHashtags);
      
      // WHAT: Merge with existing partner hashtags
      // WHY: Preserve manually added hashtags while adding auto-generated ones
      const enrichedHashtags = mergeSportsDbHashtags(
        editPartnerData.categorizedHashtags,
        generatedHashtags
      );
      console.log('Enriched hashtags:', enrichedHashtags);

      // WHAT: Upload badge to ImgBB for permanent hosting
      // WHY: Display logo in UI without depending on TheSportsDB URLs
      let logoUrl: string | undefined;
      if (team.strBadge) {
        console.log('🖼️ Uploading logo to ImgBB...');
        console.log('Badge URL:', team.strBadge);
        try {
          const imgbbRes = await fetch('/api/partners/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              badgeUrl: team.strBadge,
              partnerName: editingPartner.name,
            }),
          });
          
          console.log('ImgBB Response Status:', imgbbRes.status);
          const imgbbData = await imgbbRes.json();
          console.log('ImgBB Response Data:', imgbbData);
          
          if (imgbbData.success && imgbbData.logoUrl) {
            logoUrl = imgbbData.logoUrl;
            console.log('✅ Logo uploaded to ImgBB:', logoUrl);
          } else {
            console.warn('⚠️ Logo upload failed:', imgbbData.error);
            console.warn('Continuing without logo...');
          }
        } catch (logoErr) {
          console.error('❌ Logo upload error:', logoErr);
          // Continue without logo - non-blocking error
        }
      } else {
        console.log('ℹ️ No badge URL provided, skipping logo upload');
      }

      // WHAT: Update partner with SportsDB data and logo via PUT /api/partners
      // WHY: Persist enrichment data to MongoDB for chart system
      console.log('💾 Saving to database...');
      console.log('Partner ID:', editingPartner._id);
      console.log('SportsDB Data:', sportsDbData);
      console.log('Logo URL:', logoUrl);
      
      const updateRes = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: editingPartner._id,
          sportsDb: sportsDbData,
          logoUrl: logoUrl, // Add ImgBB logo URL
          categorizedHashtags: enrichedHashtags, // Add auto-generated hashtags
        }),
      });

      console.log('Database Update Response Status:', updateRes.status);
      const updateData = await updateRes.json();
      console.log('Database Update Response Data:', updateData);

      if (updateData.success) {
        console.log('✅ Partner linked successfully, updating UI...');
        console.log('SportsDB data:', sportsDbData);
        console.log('Logo URL:', logoUrl);
        
        // WHAT: Update local state to show enriched data immediately
        // WHY: Force React re-render by creating completely new state object
        setEditPartnerData({
          name: editPartnerData.name,
          emoji: editPartnerData.emoji,
          hashtags: editPartnerData.hashtags,
          categorizedHashtags: enrichedHashtags, // Add auto-generated hashtags
          bitlyLinkIds: editPartnerData.bitlyLinkIds,
          logoUrl: logoUrl,
          sportsDb: sportsDbData, // Add new SportsDB data
        });
        
        // WHAT: Clear search results after successful link
        setSportsDbSearch('');
        setSportsDbResults([]);
        
        // WHAT: Show success message
        setSuccessMessage(`✓ Successfully linked to ${team.strTeam}`);
        
        // WHAT: Update partners list state directly to show logo immediately
        // WHY: Avoid waiting for API reload, instant UI feedback
        setPartners(prevPartners => 
          prevPartners.map(p => 
            p._id === editingPartner._id 
              ? { ...p, logoUrl, sportsDb: sportsDbData }
              : p
          )
        );
        
        // WHAT: Also update editingPartner to keep modal data in sync
        setEditingPartner(prev => prev ? { ...prev, logoUrl, sportsDb: sportsDbData } : null);
        
        // WHAT: Reload partners list to ensure database sync
        loadData();
        
        console.log('✅ UI state updated, logo should now be visible in list');
      } else {
        console.error('❌ Failed to save:', updateData.error);
        setError(updateData.error || 'Failed to save SportsDB link');
      }
    } catch (err) {
      console.error('❌ === EXCEPTION CAUGHT ===');
      console.error('Error type:', typeof err);
      console.error('Error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      setError('Network error while linking to TheSportsDB');
    } finally {
      console.log('🏁 Linking process finished, resetting state...');
      setSportsDbLinking(false);
      console.log('🔗 === LINK TO SPORTSDB COMPLETED ===');
    }
  }

  // WHAT: Re-sync existing SportsDB data from API
  // WHY: Update capacity, league info if changed on TheSportsDB
  async function resyncSportsDbData() {
    if (!editingPartner || !editPartnerData.sportsDb?.teamId) return;

    try {
      setSportsDbLinking(true);
      setError('');

      const teamId = editPartnerData.sportsDb.teamId;
      const lookupRes = await fetch(`/api/sports-db/lookup?type=team&id=${teamId}`);
      const lookupData = await lookupRes.json();

      if (!lookupData.success || !lookupData.result) {
        setError('Failed to re-sync team details from TheSportsDB');
        return;
      }

      const team = lookupData.result;

      // WHAT: Build comprehensive SportsDB enrichment object with ALL available fields
      // WHY: Store complete team profile for KYC and future analytics (same as linkToSportsDbTeam)
      const sportsDbData = {
        // Core Identifiers
        teamId: team.idTeam,
        strTeam: team.strTeam,
        strTeamShort: team.strTeamShort,
        strAlternate: team.strAlternate,
        
        // Sport & League
        strSport: team.strSport,
        strLeague: team.strLeague,
        leagueId: team.idLeague,
        
        // Venue/Stadium
        strStadium: team.strStadium,
        venueId: team.idVenue,
        intStadiumCapacity: team.intStadiumCapacity ? parseInt(team.intStadiumCapacity, 10) : undefined,
        strStadiumThumb: team.strStadiumThumb,
        strStadiumDescription: team.strStadiumDescription,
        strStadiumLocation: team.strStadiumLocation,
        
        // Team Details
        intFormedYear: team.intFormedYear,
        strCountry: team.strCountry,
        strDescriptionEN: team.strDescriptionEN,
        
        // Visual Assets
        strTeamBadge: team.strBadge,
        strTeamLogo: team.strTeamLogo,
        strTeamJersey: team.strTeamJersey,
        strTeamBanner: team.strTeamBanner,
        strTeamFanart1: team.strTeamFanart1,
        strTeamFanart2: team.strTeamFanart2,
        strTeamFanart3: team.strTeamFanart3,
        strTeamFanart4: team.strTeamFanart4,
        
        // Social Media & Web
        strWebsite: team.strWebsite,
        strFacebook: team.strFacebook,
        strTwitter: team.strTwitter,
        strInstagram: team.strInstagram,
        
        // Sync Metadata
        lastSynced: new Date().toISOString(),
        
        // Legacy fields (backward compatibility)
        leagueName: team.strLeague,
        venueName: team.strStadium,
        venueCapacity: team.intStadiumCapacity ? parseInt(team.intStadiumCapacity, 10) : undefined,
        founded: team.intFormedYear,
        country: team.strCountry,
        website: team.strWebsite,
        badge: team.strBadge,
      };
      
      // WHAT: Auto-generate categorized hashtags from re-synced team data
      // WHY: Update hashtags if team metadata changed (e.g., league change)
      const generatedHashtags = generateSportsDbHashtags(team);
      const enrichedHashtags = mergeSportsDbHashtags(
        editPartnerData.categorizedHashtags,
        generatedHashtags
      );

      // WHAT: Upload badge to ImgBB during re-sync
      // WHY: Update logo if badge URL changed
      let logoUrl: string | undefined;
      if (team.strBadge) {
        try {
          const imgbbRes = await fetch('/api/partners/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              badgeUrl: team.strBadge,
              partnerName: editingPartner.name,
            }),
          });
          
          const imgbbData = await imgbbRes.json();
          if (imgbbData.success && imgbbData.logoUrl) {
            logoUrl = imgbbData.logoUrl;
          }
        } catch (logoErr) {
          console.error('Logo upload error during re-sync:', logoErr);
        }
      }

      const updateRes = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: editingPartner._id,
          sportsDb: sportsDbData,
          logoUrl: logoUrl, // Update logo URL
          categorizedHashtags: enrichedHashtags, // Update auto-generated hashtags
        }),
      });

      const updateData = await updateRes.json();

      if (updateData.success) {
        setSuccessMessage(`✓ Successfully re-synced data from TheSportsDB`);
        setEditPartnerData(prev => ({
          ...prev,
          sportsDb: sportsDbData,
          logoUrl: logoUrl, // Update logo URL in local state
          categorizedHashtags: enrichedHashtags, // Update hashtags in local state
        }));
        loadData();
      } else {
        setError(updateData.error || 'Failed to re-sync SportsDB data');
      }
    } catch (err) {
      setError('Network error while re-syncing TheSportsDB data');
      console.error('SportsDB re-sync error:', err);
    } finally {
      setSportsDbLinking(false);
    }
  }

  // WHAT: Handle manual SportsDB data entry
  // WHY: Fallback when API doesn't have team or returns wrong data
  async function handleManualEntry(e: React.FormEvent) {
    e.preventDefault();
    
    if (!editingPartner) return;
    
    try {
      setSportsDbLinking(true);
      setError('');
      
      // WHAT: Build SportsDB data from manual input
      const sportsDbData = {
        teamId: undefined, // No API team ID
        leagueId: undefined,
        venueId: undefined,
        venueCapacity: manualEntryData.venueCapacity ? parseInt(manualEntryData.venueCapacity, 10) : undefined,
        venueName: manualEntryData.venueName || undefined,
        leagueName: manualEntryData.leagueName || undefined,
        founded: manualEntryData.founded || undefined,
        country: manualEntryData.country || undefined,
        website: undefined,
        badge: manualEntryData.logoUrl || undefined,
        lastSynced: new Date().toISOString(),
      };
      
      // WHAT: Upload logo to ImgBB if URL provided
      let logoUrl: string | undefined;
      if (manualEntryData.logoUrl) {
        console.log('🖼️ Uploading manually provided logo to ImgBB...');
        try {
          const imgbbRes = await fetch('/api/partners/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              badgeUrl: manualEntryData.logoUrl,
              partnerName: editingPartner.name,
            }),
          });
          
          const imgbbData = await imgbbRes.json();
          if (imgbbData.success && imgbbData.logoUrl) {
            logoUrl = imgbbData.logoUrl;
            console.log('✅ Logo uploaded to ImgBB:', logoUrl);
          }
        } catch (logoErr) {
          console.error('❌ Logo upload error:', logoErr);
        }
      }
      
      // WHAT: Save to database
      const updateRes = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: editingPartner._id,
          sportsDb: sportsDbData,
          logoUrl: logoUrl,
        }),
      });
      
      const updateData = await updateRes.json();
      
      if (updateData.success) {
        setSuccessMessage('✓ Successfully added manual sports data');
        
        // Update local state
        setEditPartnerData({
          name: editPartnerData.name,
          emoji: editPartnerData.emoji,
          hashtags: editPartnerData.hashtags,
          categorizedHashtags: editPartnerData.categorizedHashtags,
          bitlyLinkIds: editPartnerData.bitlyLinkIds,
          logoUrl: logoUrl,
          sportsDb: sportsDbData,
        });
        
        // Update partners list
        setPartners(prevPartners => 
          prevPartners.map(p => 
            p._id === editingPartner._id 
              ? { ...p, logoUrl, sportsDb: sportsDbData }
              : p
          )
        );
        
        setEditingPartner(prev => prev ? { ...prev, logoUrl, sportsDb: sportsDbData } : null);
        
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
        
        loadData();
      } else {
        setError(updateData.error || 'Failed to save manual sports data');
      }
    } catch (err) {
      setError('Network error while saving manual sports data');
      console.error('Manual entry error:', err);
    } finally {
      setSportsDbLinking(false);
    }
  }
  
  // WHAT: Open edit modal with partner data
  // WHY: Populate form with existing partner values including SportsDB enrichment
  function openEditForm(partner: PartnerResponse) {
    loadBitlyLinks(); // Lazy load links when opening form
    setEditingPartner(partner);
    setEditPartnerData({
      name: partner.name,
      emoji: partner.emoji,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      bitlyLinkIds: partner.bitlyLinks?.map(link => link._id) || [],
      logoUrl: partner.logoUrl,
      sportsDb: partner.sportsDb,
    });
    // WHAT: Clear SportsDB search state when opening edit form
    // WHY: Start fresh for each edit session
    setSportsDbSearch('');
    setSportsDbResults([]);
    setShowEditForm(true);
  }

  // WHAT: Handle updating an existing partner
  // WHY: Allows editing partner details
  async function handleUpdatePartner(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!editingPartner || !editPartnerData.name.trim() || !editPartnerData.emoji.trim()) {
      setError('Name and emoji are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: editingPartner._id,
          ...editPartnerData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Partner "${editPartnerData.name}" updated successfully!`);
        setShowEditForm(false);
        setEditingPartner(null);
        loadData(); // Reload to show updated partner
      } else {
        setError(data.error || 'Failed to update partner');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update partner error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // WHAT: Handle deleting a partner
  // WHY: Remove organizations from system
  async function handleDeletePartner(partnerId: string, partnerName: string) {
    if (!confirm(`Delete partner "${partnerName}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/partners?partnerId=${partnerId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Partner "${partnerName}" deleted successfully`);
        loadData(); // Reload to remove deleted partner
      } else {
        setError(data.error || 'Failed to delete partner');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete partner error:', err);
    }
  }

  // WHAT: Auth check wrapper
  // WHY: Ensure user is authenticated before showing partners management
  const { user, loading: authLoading } = useAdminAuth();

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
    return null; // Will redirect to login
  }

  // WHAT: AdminHero component for standardized header
  // WHY: Matches design system used in /admin/projects and other admin pages
  return (
    <div className="page-container">
      <AdminHero
        title="🤝 Partner Management"
        subtitle="Manage organizations that own or operate events: clubs, federations, venues, brands"
        backLink="/admin"
        showSearch
        searchValue={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        searchPlaceholder="Search partners..."
        actionButtons={[
          {
            label: 'Add Partner',
            icon: '+',
            onClick: () => {
              loadBitlyLinks(); // Lazy load links when opening form
              setShowAddForm(true);
            },
            variant: 'primary',
            title: 'Create a new partner organization'
          }
        ]}
      />

      {/* WHAT: Status messages with proper spacing */}
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

      {/* WHAT: Pagination stats header */}
      {!loading && partners.length > 0 && (
        <div className={logoStyles.paginationStats}>
          <div className={logoStyles.paginationText}>
            Showing {partners.length} of {totalMatched} partners
          </div>
        </div>
      )}

      {/* WHAT: Partners table with standardized structure */}
      <div className="projects-table-container">
        <div className="table-overflow-hidden">
          {partners.length === 0 ? (
            /* WHAT: Empty state */
            <div className="admin-empty-state">
              <div className="admin-empty-icon">🤝</div>
              <div className="admin-empty-title">No Partners Yet</div>
              <div className="admin-empty-subtitle">
                Click &quot;Add Partner&quot; above to create your first partner organization
              </div>
            </div>
          ) : (
            /* WHAT: Standardized table matching projects page structure */
            <table className="projects-table table-full-width table-inherit-radius">
              <thead>
                <tr>
                  <th className={styles.colIcon}>Icon</th>
                  <th className={styles.colFlag}>Flag</th>
                  <th className={styles.colLogo}>Logo</th>
                  <th 
                    onClick={() => handleSort('name')} 
                    className={`sortable-th ${styles.colName}`}
                  >
                    Name
                    {sortField === 'name' && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th className={styles.colHashtags}>Hashtags</th>
                  <th className={styles.colBitlyLinks}>Bitly Links</th>
                  <th 
                    onClick={() => handleSort('updatedAt')} 
                    className={`sortable-th ${styles.colUpdated}`}
                  >
                    Updated
                    {sortField === 'updatedAt' && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th className={styles.colActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(partner => (
                  <tr key={partner._id}>
                    <td className={styles.emojiCell}>{partner.emoji}</td>
                    <td className={styles.flagCell}>
                      {/* WHAT: Display country flag from SportsDB data */}
                      {/* WHY: Visual identification of partner's country */}
                      {countryToFlag(partner.sportsDb?.strCountry) || '—'}
                    </td>
                    <td className={styles.logoCell}>
                      {/* WHAT: Display partner logo from ImgBB */}
                      {/* WHY: Show team badge for visual identification */}
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={`${partner.name} logo`}
                          className={styles.logoImage}
                          title={`${partner.name} logo`}
                        />
                      ) : (
                        <span className={styles.logoPlaceholder}>—</span>
                      )}
                    </td>
                    <td className="font-medium">{partner.name}</td>
                    <td>
                      {/* WHAT: Display hashtags as bubbles */}
                      <div className={styles.hashtagsContainer}>
                        {/* Traditional hashtags */}
                        {partner.hashtags && partner.hashtags.map(hashtag => (
                          <ColoredHashtagBubble
                            key={`general-${hashtag}`}
                            hashtag={hashtag}
                            small={true}
                            interactive={false}
                            projectCategorizedHashtags={partner.categorizedHashtags}
                            autoResolveColor={true}
                          />
                        ))}
                        {/* Categorized hashtags */}
                        {partner.categorizedHashtags && Object.entries(partner.categorizedHashtags).map(([category, hashtags]) =>
                          hashtags.map(hashtag => (
                            <ColoredHashtagBubble
                              key={`${category}-${hashtag}`}
                              hashtag={`${category}:${hashtag}`}
                              showCategoryPrefix={true}
                              small={true}
                              interactive={false}
                            />
                          ))
                        )}
                        {!partner.hashtags?.length && !Object.keys(partner.categorizedHashtags || {}).length && (
                          <span className="text-gray-400 text-sm">No hashtags</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {/* WHAT: Display Bitly links */}
                      {partner.bitlyLinks && partner.bitlyLinks.length > 0 ? (
                        <div className={styles.bitlyLinksContainer}>
                          {partner.bitlyLinks.map(link => (
                            <a
                              key={link._id}
                              href={`https://${link.bitlink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary text-sm"
                              title={link.title}
                            >
                              {link.bitlink}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No links</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600">
                      {new Date(partner.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons-container">
                        <button
                          onClick={() => openEditForm(partner)}
                          className="btn btn-small btn-primary action-button"
                          title="Edit partner"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner._id, partner.name)}
                          className="btn btn-small btn-danger action-button"
                          title="Delete partner"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* WHAT: Load More button */}
      <div className="p-4 text-center">
        {nextOffset !== null ? (
          <button 
            className="btn btn-small btn-secondary" 
            disabled={loadingMore} 
            onClick={loadMore}
          >
            {loadingMore ? 'Loading…' : 'Load 20 more'}
          </button>
        ) : (
          partners.length > 0 && (
            <span className="text-gray-500 text-sm">No more items</span>
          )
        )}
      </div>

      {/* WHAT: Add Partner Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">+ Add Partner</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPartner}>
              <div className="modal-body">
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
                  <input
                    type="text"
                    className="form-input"
                    value={newPartnerData.emoji}
                    onChange={(e) => setNewPartnerData(prev => ({ ...prev, emoji: e.target.value }))}
                    placeholder="⚽ 🏟️ 🏆 (single emoji)"
                    required
                    maxLength={4}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Choose an emoji to represent this partner
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
                    availableLinks={allBitlyLinks}
                    onChange={(linkIds) => 
                      setNewPartnerData(prev => ({ ...prev, bitlyLinkIds: linkIds }))
                    }
                    placeholder="Search and add Bitly links..."
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Search by bitlink or title, click to add. Remove with ✕ button.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-small btn-secondary" 
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-small btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHAT: Edit Partner Modal */}
      {showEditForm && editingPartner && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Partner</h2>
              <button className="modal-close" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdatePartner}>
              <div className="modal-body">
                <div className="form-group mb-4">
                  <label className="form-label-block">Partner Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPartnerData.name}
                    onChange={(e) => setEditPartnerData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter partner name"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Partner Emoji *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPartnerData.emoji}
                    onChange={(e) => setEditPartnerData(prev => ({ ...prev, emoji: e.target.value }))}
                    placeholder="⚽ 🏟️ 🏆"
                    required
                    maxLength={4}
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Hashtags (optional)</label>
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
                  <label className="form-label-block">Bitly Links (optional)</label>
                  <BitlyLinksSelector
                    selectedLinkIds={editPartnerData.bitlyLinkIds}
                    availableLinks={allBitlyLinks}
                    onChange={(linkIds) => 
                      setEditPartnerData(prev => ({ ...prev, bitlyLinkIds: linkIds }))
                    }
                    placeholder="Search and add Bitly links..."
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Search by bitlink or title, click to add. Remove with ✕ button.
                  </p>
                </div>

                {/* WHAT: SportsDB Team Linking Section */}
                {/* WHY: Allow enriching partner with sports club metadata (capacity, league, badge) */}
                <div className="form-group mb-4">
                  <label className="form-label-block">Link to TheSportsDB (optional)</label>
                  
                  {/* WHAT: Display existing SportsDB link if present */}
                  {editPartnerData.sportsDb && (
                    <div className={styles.sportsDbPanel}>
                      <div className={styles.sportsDbPanelInner}>
                        {/* WHAT: Display team badge if available */}
                        {editPartnerData.sportsDb.badge && (
                          <img
                            src={editPartnerData.sportsDb.badge}
                            alt="Team badge"
                            className={styles.sportsDbBadge}
                          />
                        )}
                        <div className={styles.sportsDbInfo}>
                          <div className={styles.sportsDbTitle}>
                            ✓ Linked to TheSportsDB
                          </div>
                          {editPartnerData.sportsDb.leagueName && (
                            <div className={styles.sportsDbInfoLine}>
                              League: {editPartnerData.sportsDb.leagueName}
                            </div>
                          )}
                          {editPartnerData.sportsDb.venueName && (
                            <div className={styles.sportsDbInfoLine}>
                              Venue: {editPartnerData.sportsDb.venueName}
                              {editPartnerData.sportsDb.venueCapacity && (
                                <span> ({editPartnerData.sportsDb.venueCapacity.toLocaleString()} capacity)</span>
                              )}
                            </div>
                          )}
                          {editPartnerData.sportsDb.country && (
                            <div className={styles.sportsDbInfoLine}>
                              Country: {editPartnerData.sportsDb.country}
                            </div>
                          )}
                          {editPartnerData.sportsDb.founded && (
                            <div className={styles.sportsDbInfoLine}>
                              Founded: {editPartnerData.sportsDb.founded}
                            </div>
                          )}
                          {editPartnerData.sportsDb.lastSynced && (
                            <div className={styles.sportsDbSyncTime}>
                              Last synced: {new Date(editPartnerData.sportsDb.lastSynced).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* WHAT: Re-sync button to update SportsDB data */}
                      {/* WHY: Capacity and league info may change over time */}
                      <button
                        type="button"
                        onClick={resyncSportsDbData}
                        disabled={sportsDbLinking}
                        className={`btn btn-small btn-secondary ${styles.sportsDbResyncButton}`}
                      >
                        {sportsDbLinking ? '🔄 Syncing...' : '🔄 Re-sync from TheSportsDB'}
                      </button>
                    </div>
                  )}

                  {/* WHAT: Search interface for finding teams */}
                  {/* WHY: Allow admin to search TheSportsDB by team name */}
                  <div className={styles.sportsDbSearchContainer}>
                    <input
                      type="text"
                      className={`form-input ${styles.sportsDbSearchInput}`}
                      value={sportsDbSearch}
                      onChange={(e) => setSportsDbSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchSportsDbTeams();
                        }
                      }}
                      placeholder="Search TheSportsDB by team name..."
                    />
                    <button
                      type="button"
                      onClick={searchSportsDbTeams}
                      disabled={sportsDbSearching || !sportsDbSearch.trim()}
                      className="btn btn-small btn-primary"
                    >
                      {sportsDbSearching ? '🔍 Searching...' : '🔍 Search'}
                    </button>
                  </div>

                  {/* WHAT: Display search results with link buttons */}
                  {/* WHY: Show matching teams with relevant metadata for admin selection */}
                  {sportsDbResults.length > 0 && (
                    <div className={styles.sportsDbResults}>
                      {sportsDbResults.map((team) => (
                        <div
                          key={team.idTeam}
                          className={styles.teamResultItem}
                        >
                          {/* WHAT: Team badge thumbnail */}
                          {team.strBadge && (
                            <img
                              src={team.strBadge}
                              alt={team.strTeam}
                              className={styles.teamResultBadge}
                            />
                          )}
                          <div className={styles.teamResultInfo}>
                            <div className={styles.teamResultName}>
                              {team.strTeam}
                            </div>
                            {/* WHAT: Show sport type to differentiate multi-sport clubs */}
                            {/* WHY: Aalborg has handball, soccer teams - user needs to know which */}
                            {team.strSport && (
                              <div className={styles.teamResultSport}>
                                🏅 {team.strSport}
                              </div>
                            )}
                            {team.strLeague && (
                              <div className={styles.teamResultLeague}>
                                {team.strLeague}
                              </div>
                            )}
                            {team.strCountry && (
                              <div className={styles.teamResultCountry}>
                                🌍 {team.strCountry}
                              </div>
                            )}
                            {team.intStadiumCapacity && (
                              <div className={styles.teamResultCapacity}>
                                🏟️ Capacity: {parseInt(team.intStadiumCapacity, 10).toLocaleString()}
                              </div>
                            )}
                          </div>
                          {/* WHAT: Link button with team data to bypass buggy lookup API */}
                          {/* WHY: Search API works correctly, lookup API returns wrong teams */}
                          <button
                            type="button"
                            onClick={() => {
                              console.log('👆 LINK BUTTON CLICKED for team:', team.idTeam, team.strTeam);
                              linkToSportsDbTeam(team.idTeam, team);
                            }}
                            disabled={sportsDbLinking}
                            className="btn btn-small btn-primary"
                          >
                            {sportsDbLinking ? '🔗 Linking...' : '🔗 Link'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WHAT: Manual entry button */}
                  {/* WHY: Fallback when team not in API or API returns wrong data */}
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(true)}
                    className={styles.manualEntryButton}
                  >
                    🖊️ Can&apos;t find it? Enter manually (Recommended for missing teams)
                  </button>

                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> TheSportsDB FREE API has limitations - it may not return all teams shown on their website. 
                    If you can&apos;t find your team, use the manual entry button above.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-small btn-secondary" 
                  onClick={() => setShowEditForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-small btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHAT: Manual Sports Data Entry Modal */}
      {/* WHY: Fallback when TheSportsDB doesn't have team or API returns wrong data */}
      {showManualEntry && (
        <div className="modal-overlay" onClick={() => setShowManualEntry(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🖊️ Enter Sports Data Manually</h2>
              <button className="modal-close" onClick={() => setShowManualEntry(false)}>✕</button>
            </div>
            <form onSubmit={handleManualEntry}>
              <div className="modal-body">
                <p className="text-sm text-gray-600 mb-4">
                  Use this form when TheSportsDB doesn&apos;t have the team or returns incorrect data. All fields are optional.
                </p>
                
                <div className="form-group mb-4">
                  <label className="form-label-block">Venue Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualEntryData.venueName}
                    onChange={(e) => setManualEntryData(prev => ({ ...prev, venueName: e.target.value }))}
                    placeholder="e.g., Jutlander Bank Arena"
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Venue Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manualEntryData.venueCapacity}
                    onChange={(e) => setManualEntryData(prev => ({ ...prev, venueCapacity: e.target.value }))}
                    placeholder="e.g., 5000"
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">League Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualEntryData.leagueName}
                    onChange={(e) => setManualEntryData(prev => ({ ...prev, leagueName: e.target.value }))}
                    placeholder="e.g., Danish Mens Handball League"
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualEntryData.country}
                    onChange={(e) => setManualEntryData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., Denmark"
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Founded Year</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualEntryData.founded}
                    onChange={(e) => setManualEntryData(prev => ({ ...prev, founded: e.target.value }))}
                    placeholder="e.g., 2000"
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
                  <p className="text-xs text-gray-600 mt-1">
                    Logo will be uploaded to ImgBB for permanent hosting
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-small btn-secondary" 
                  onClick={() => setShowManualEntry(false)}
                  disabled={sportsDbLinking}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-small btn-primary"
                  disabled={sportsDbLinking}
                >
                  {sportsDbLinking ? 'Saving...' : 'Save Sports Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
