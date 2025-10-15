// app/admin/bitly/page.tsx
// WHAT: Admin interface for managing Bitly link associations
// WHY: Provides visual UI for connecting Bitly URLs to MessMass projects with proper design system compliance
// DESIGN SYSTEM: Uses AdminHero, modal pattern, and standardized table layout matching /admin/projects
// USER WORKFLOW: AdminHero with action buttons → Table with inline actions → Modal forms

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminHero from '@/components/AdminHero';
import ProjectSelector from '@/components/ProjectSelector';

// WHAT: Type definitions for links and projects
// WHY: Maintains type safety for Bitly integration with MessMass events
interface BitlyLink {
  _id: string;
  projectId: string | null;
  bitlink: string;
  long_url: string;
  title: string;
  tags: string[];
  click_summary: {
    total: number;
    unique?: number;
    updatedAt: string;
  };
  lastSyncAt: string;
  createdAt: string;
  // Many-to-many junction data (if available)
  associations?: Array<{
    projectId: string;
    projectName: string;
    startDate: string | null;
    endDate: string | null;
    autoCalculated: boolean;
    clicks: number;
    lastSyncedAt: string | null;
  }>;
}

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
}

export default function BitlyAdminPage() {
  // WHAT: Component state management
  // WHY: Tracks links, projects, UI state, and user inputs
  const router = useRouter();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<BitlyLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // WHAT: Pagination state following /admin/projects pattern
  // WHY: Handle large datasets (3000+ links) without timeouts
  const [totalMatched, setTotalMatched] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const PAGE_SIZE = 20;
  
  // WHAT: Search state with debouncing
  // WHY: Allow users to filter through thousands of links
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // WHAT: Sorting state
  // WHY: Enable user-controlled table sorting like projects page
  type SortField = 'bitlink' | 'title' | 'clicks' | 'lastSyncAt' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  
  // WHAT: Form state for adding new links
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBitlink, setNewBitlink] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');

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
    const allowedFields: SortField[] = ['bitlink', 'title', 'clicks', 'lastSyncAt'];
    const allowedOrders: SortOrder[] = ['asc', 'desc'];
    if (sf && allowedFields.includes(sf)) setSortField(sf);
    if (so && allowedOrders.includes(so)) setSortOrder(so);
  }, [searchParams]);

  // WHAT: Load first page when search/sort changes
  // WHY: Fresh search or sort requires restarting pagination
  useEffect(() => {
    // WHAT: Use different loading function based on whether this is initial load or search
    // WHY: Prevents full page loading screen during search - matches Projects page UX
    if (debouncedTerm || sortField || sortOrder) {
      loadSearch();
    } else {
      loadInitialData();
    }
  }, [debouncedTerm, sortField, sortOrder]);

  // WHAT: Load initial page of links (first mount only)
  // WHY: Shows full loading screen on initial page load
  async function loadInitialData() {
    try {
      setLoading(true);
      setError('');
      setLinks([]); // Clear existing links

      // WHAT: Fetch ALL projects for ProjectSelector (no pagination)
      // WHY: User needs to search through entire project database
      const projectsRes = await fetch('/api/projects?limit=1000&sortField=eventDate&sortOrder=desc');
      const projectsData = await projectsRes.json();
      
      // WHAT: Build links API URL with pagination, search, and sorting
      // WHY: Load only 20 links at a time for performance
      const params = new URLSearchParams();
      params.set('includeUnassigned', 'true');
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', '0');
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }
      
      // WHAT: Fetch first page of Bitly links
      const linksRes = await fetch(`/api/bitly/links?${params.toString()}`);
      const linksData = await linksRes.json();

      if (projectsData.success && projectsData.projects) {
        setProjects(projectsData.projects);
      }

      if (linksData.success && linksData.links) {
        setLinks(linksData.links);
        setTotalMatched(linksData.pagination.total);
        setNextOffset(linksData.pagination.hasMore ? PAGE_SIZE : null);
      }
    } catch (err) {
      setError('Failed to load data. Please refresh the page.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // WHAT: Load links during search/sort operations (no full loading screen)
  // WHY: Prevents white flash reload effect during search - updates results inline
  // PATTERN: Matches app/admin/projects/ProjectsPageClient.tsx search behavior
  async function loadSearch() {
    try {
      setIsSearching(true);
      setError('');
      setLinks([]); // Clear existing links

      // WHAT: Fetch ALL projects for ProjectSelector (no pagination)
      // WHY: User needs to search through entire project database
      const projectsRes = await fetch('/api/projects?limit=1000&sortField=eventDate&sortOrder=desc');
      const projectsData = await projectsRes.json();
      
      // WHAT: Build links API URL with pagination, search, and sorting
      // WHY: Load only 20 links at a time for performance
      const params = new URLSearchParams();
      params.set('includeUnassigned', 'true');
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', '0');
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }
      
      // WHAT: Fetch first page of Bitly links
      const linksRes = await fetch(`/api/bitly/links?${params.toString()}`);
      const linksData = await linksRes.json();

      if (projectsData.success && projectsData.projects) {
        setProjects(projectsData.projects);
      }

      if (linksData.success && linksData.links) {
        setLinks(linksData.links);
        setTotalMatched(linksData.pagination.total);
        setNextOffset(linksData.pagination.hasMore ? PAGE_SIZE : null);
      }
    } catch (err) {
      setError('Failed to load data. Please refresh the page.');
      console.error('Load search error:', err);
    } finally {
      setIsSearching(false);
    }
  }

  // WHAT: Load more links (pagination)
  // WHY: "Load 20 more" button functionality
  async function loadMore() {
    if (nextOffset === null || loadingMore) return;

    try {
      setLoadingMore(true);
      setError('');

      const params = new URLSearchParams();
      params.set('includeUnassigned', 'true');
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', nextOffset.toString());
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }
      
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }

      const res = await fetch(`/api/bitly/links?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.links) {
        setLinks(prev => [...prev, ...data.links]);
        setNextOffset(data.pagination.hasMore ? nextOffset + PAGE_SIZE : null);
      }
    } catch (err) {
      setError('Failed to load more links.');
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  // WHAT: Handle sorting column click
  // WHY: Three-state cycle per column: asc → desc → clear (matches projects page behavior)
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
    // WHY: Allow users to share sorted views via URL
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

  // WHAT: Handle adding a new Bitly link
  // WHY: Allows user to associate Bitly URLs with projects
  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newBitlink.trim()) {
      setError('Please enter a Bitly link or URL');
      return;
    }

    try {
      const res = await fetch('/api/bitly/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
          bitlinkOrLongUrl: newBitlink.trim(),
          title: customTitle.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ ${data.message} - You can add this link to more projects or close the form.`);
        // WHAT: Keep form open and bitlink filled for adding to multiple projects
        // WHY: Many-to-many support - same link can be used by multiple events
        // Only clear the project selector to allow selecting another project
        setSelectedProjectId('');
        setCustomTitle('');
        reloadLinks(); // Reload to show new association
      } else {
        setError(data.error || 'Failed to add link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Add link error:', err);
    }
  }

  // WHAT: Handle removing a link-to-project association
  // WHY: Allow users to correct mistakes or remove outdated associations
  async function handleRemoveAssociation(linkId: string, bitlink: string, projectId: string, projectName: string) {
    if (!confirm(`Remove association between ${bitlink} and ${projectName}?`)) {
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/bitly/associations?bitlyLinkId=${linkId}&projectId=${projectId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Removed ${bitlink} from ${projectName}`);
        
        // WHAT: Update local state without reloading entire page
        // WHY: Instant UI update, no page reload needed
        setLinks(prevLinks => 
          prevLinks.map(link => {
            if (link._id === linkId) {
              // WHAT: Remove association from this link's associations array
              return {
                ...link,
                associations: (link.associations || []).filter(assoc => assoc.projectId !== projectId)
              };
            }
            return link;
          })
        );
      } else {
        setError(data.error || 'Failed to remove association');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Remove association error:', err);
    }
  }

  // WHAT: Handle adding a link to a project (many-to-many)
  // WHY: Allows same link to be associated with multiple events via junction table
  async function handleAddLinkToProject(linkId: string, bitlink: string, projectId: string) {
    console.log('[handleAddLinkToProject] Called with:', { linkId, bitlink, projectId });
    setError('');
    setSuccessMessage('');

    try {
      // Call the same POST endpoint that now supports many-to-many
      const requestBody = {
        projectId: projectId,
        bitlinkOrLongUrl: bitlink,
      };
      console.log('[handleAddLinkToProject] Sending request:', requestBody);
      
      const res = await fetch('/api/bitly/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[handleAddLinkToProject] Response status:', res.status);

      const data = await res.json();
      console.log('[handleAddLinkToProject] Response data:', data);

      if (data.success) {
        const project = projects.find(p => p._id === projectId);
        const projectName = project?.eventName || 'selected project';
        setSuccessMessage(`✓ ${bitlink} added to ${projectName}`);
        console.log('[handleAddLinkToProject] Success! Updating local state...');
        
        // WHAT: Update local state without reloading entire page
        // WHY: Instant UI update, no flickering, better UX
        setLinks(prevLinks => 
          prevLinks.map(link => {
            if (link._id === linkId) {
              // WHAT: Add new association to this link's associations array
              const newAssociation = {
                projectId,
                projectName,
                startDate: null, // Will be calculated by backend
                endDate: null,
                autoCalculated: true,
                clicks: 0,
                lastSyncedAt: null
              };
              return {
                ...link,
                associations: [...(link.associations || []), newAssociation]
              };
            }
            return link;
          })
        );
      } else {
        console.error('[handleAddLinkToProject] API returned error:', data.error);
        setError(data.error || 'Failed to add link to project');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('[handleAddLinkToProject] Exception:', err);
    }
  }

  // WHAT: Handle archiving a link
  // WHY: Removes link from active tracking while preserving history
  async function handleArchiveLink(linkId: string) {
    if (!confirm('Archive this link? It will be hidden but data is preserved.')) {
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/bitly/links/${linkId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('✓ Link archived');
        reloadLinks(); // Reload to remove archived link from list
      } else {
        setError(data.error || 'Failed to archive link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Archive error:', err);
    }
  }

  // WHAT: Pull/refresh analytics data for a specific link (emergency use only)
  // WHY: Manual override when immediate data update is needed before next daily sync
  async function handlePullLinkData(linkId: string, bitlink: string) {
    if (!confirm(`Manually pull latest analytics for ${bitlink}?\n\nNote: Analytics are automatically synced daily at 3 AM UTC. Only use this if you need immediate updates.`)) {
      return;
    }

    setError('');
    setSuccessMessage(`Pulling analytics for ${bitlink}...`);

    try {
      const res = await fetch(`/api/bitly/analytics/${linkId}?refresh=true`, {
        method: 'GET',
      });

      const data = await res.json();

      if (data.success && data.refreshed) {
        setSuccessMessage(`✓ Analytics refreshed for ${bitlink}`);
        reloadLinks(); // Reload to show updated analytics
      } else if (data.success) {
        setSuccessMessage(`✓ Analytics loaded for ${bitlink} (cached data)`);
      } else {
        setError(data.error || 'Failed to pull analytics');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Pull link data error:', err);
    }
  }

  // WHAT: Trigger manual sync for all links
  // WHY: Allows immediate data refresh without waiting for scheduled sync
  async function handleManualSync() {
    setError('');
    setSuccessMessage('Syncing... This may take a minute.');

    try {
      const res = await fetch('/api/bitly/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Sync complete! Updated ${data.summary.linksUpdated} links.`);
        reloadLinks(); // Reload to show updated analytics
      } else {
        setError(data.message || 'Sync failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Sync error:', err);
    }
  }

  // WHAT: Refresh cached metrics for all junction table entries
  // WHY: Updates date-range-filtered metrics after sync or when needed
  async function handleRefreshMetrics() {
    if (!confirm('Refresh all cached Bitly metrics?\n\nThis will update analytics for all event-link associations using the latest Bitly data.')) {
      return;
    }

    setError('');
    setSuccessMessage('Refreshing cached metrics... This may take a minute.');

    try {
      const res = await fetch('/api/bitly/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all' }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Refreshed ${data.associationsUpdated} event-link associations!`);
        reloadLinks(); // Reload to show updated metrics
      } else {
        setError(data.error || 'Refresh failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Refresh metrics error:', err);
    }
  }

  // WHAT: Pull links from Bitly group and import only NEW ones (bulk operation)
  // WHY: Fast bulk import that automatically skips existing links
  async function handlePullData() {
    if (!confirm('🔗 Get Links from Bitly.com\n\nThis will automatically:\n\n✓ Fetch up to 100 links from your Bitly group (fast single request)\n✓ Filter and import ONLY NEW links not yet in database\n✓ Skip links that already exist (automatic duplicate detection)\n✓ Bulk insert for maximum performance\n\n💡 Click multiple times to import more batches of 100 links.\n\nContinue?')) {
      return;
    }

    setError('');
    setSuccessMessage('Pulling data from Bitly... Fetching 100 links...');

    try {
      const res = await fetch('/api/bitly/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      });

      const data = await res.json();

      if (data.success) {
        const summary = data.summary;
        const message = `✓ ${data.message}\nTotal: ${summary.total}, Imported: ${summary.imported}, Skipped: ${summary.skipped}, Errors: ${summary.errors}`;
        
        if (summary.imported > 0) {
          setSuccessMessage(message + '\n\n💡 Tip: Click "Get Links" again to import the next 100!');
        } else if (summary.skipped > 0 && summary.skipped === summary.total) {
          setSuccessMessage(message + '\n\n✅ These 100 links already exist. Click again to check next batch!');
        } else {
          setSuccessMessage(message);
        }
        
        reloadLinks(); // Reload to show newly imported links
      } else {
        // WHAT: Handle specific Bitly API errors
        if (data.error?.includes('403') || data.error?.includes('Forbidden')) {
          setError('⚠️ Bitly API Error: Access forbidden. Please check your Bitly access token has proper permissions.');
        } else if (data.error?.includes('429') || data.error?.includes('rate limit')) {
          setError('⚠️ Rate Limit: Too many requests. Please wait a moment and try again.');
        } else {
          setError(data.error || 'Pull failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Pull error:', err);
    }
  }

  // WHAT: Find project name by ID for display
  function getProjectName(projectId: string | null): string {
    if (!projectId) return '(Unassigned)';
    const project = projects.find(p => p._id === projectId);
    return project ? project.eventName : 'Unknown Project';
  }

  // WHAT: Format date for display
  function formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleString();
    } catch {
      return isoDate;
    }
  }

  // WHAT: Format date range for display
  // WHY: Shows temporal boundaries for many-to-many link associations
  function formatDateRange(startDate: string | null, endDate: string | null): string {
    if (startDate === null && endDate === null) {
      return 'All time';
    }
    if (startDate === null) {
      return `Until ${endDate}`;
    }
    if (endDate === null) {
      return `From ${startDate} onward`;
    }
    return `${startDate} to ${endDate}`;
  }

  // WHAT: Helper to determine which load function to use
  // WHY: After mutations (add/delete/sync), reload without full loading screen if search/sort active
  function reloadLinks() {
    if (debouncedTerm || sortField || sortOrder) {
      loadSearch();
    } else {
      loadInitialData();
    }
  }

  // WHAT: Auth check wrapper
  // WHY: Ensure user is authenticated before showing Bitly management
  const { user, loading: authLoading } = useAdminAuth();

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">🔗</div>
          <div className="text-gray-600">Loading Bitly links...</div>
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
        title="🔗 Bitly Link Management"
        subtitle="Manage Bitly link associations, track click analytics, and connect shortened URLs to your MessMass events"
        backLink="/admin"
        showSearch
        searchValue={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        searchPlaceholder="Search Bitly links..."
        onSearchKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        actionButtons={[
          {
            label: 'Get Links from Bitly',
            icon: '⬇️',
            onClick: handlePullData,
            variant: 'info',
            title: 'Automatically import all links from your Bitly.com organization'
          },
          {
            label: 'Sync Now',
            icon: '🔄',
            onClick: handleManualSync,
            variant: 'success',
            title: 'Manually refresh analytics for all links'
          },
          {
            label: 'Refresh Metrics',
            icon: '📊',
            onClick: handleRefreshMetrics,
            variant: 'secondary',
            title: 'Update cached metrics for all event associations'
          },
          {
            label: 'Add Link',
            icon: '+',
            onClick: () => setShowAddForm(true),
            variant: 'primary',
            title: 'Add a new Bitly link'
          }
        ]}
      />

      {/* WHAT: Status messages with proper spacing
       * WHY: Consistent alert styling matching admin pages */}
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

      {/* WHAT: Pagination stats header showing X of Y items
       * WHY: Consistent format matching projects page design */}
      {!loading && links.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Showing {links.length} of {totalMatched} links
          </div>
        </div>
      )}

      {/* WHAT: Links table with standardized structure
       * WHY: Matches projects page table design for consistency */}
      <div className="projects-table-container">
        <div className="table-overflow-hidden">
          {links.length === 0 ? (
            /* WHAT: Empty state matching ProjectsPageClient pattern
             * WHY: Consistent UX across admin pages */
            <div className="admin-empty-state">
              <div className="admin-empty-icon">🔗</div>
              <div className="admin-empty-title">No Bitly Links Yet</div>
              <div className="admin-empty-subtitle">
                Click &quot;Add Link&quot; above to connect your first Bitly shortened URL to a MessMass event
              </div>
            </div>
          ) : (
            /* WHAT: Standardized table matching projects page structure
             * WHY: Consistent table styling across admin pages
             * RESPONSIVE: word-break on long text to prevent overflow */
            <table className="projects-table table-full-width table-inherit-radius">
              <thead>
                <tr>
                  {/* WHAT: Sortable column headers with click handlers and indicators
                   * WHY: Enable user-controlled sorting matching projects page behavior */}
                  <th 
                    onClick={() => handleSort('bitlink')} 
                    className="sortable-th" 
                    style={{ width: '18%', minWidth: '150px' }}
                  >
                    Bitly Link
                    {sortField === 'bitlink' && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th 
                    onClick={() => handleSort('title')} 
                    className="sortable-th" 
                    style={{ width: '22%', minWidth: '150px' }}
                  >
                    Title
                    {sortField === 'title' && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th style={{ width: '25%', minWidth: '200px' }}>Associated Projects</th>
                  <th 
                    onClick={() => handleSort('clicks')} 
                    className="sortable-th" 
                    style={{ width: '10%', minWidth: '80px' }}
                  >
                    Clicks
                    {sortField === 'clicks' && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th 
                    onClick={() => handleSort('lastSyncAt')} 
                    className="sortable-th" 
                    style={{ width: '15%', minWidth: '120px' }}
                  >
                    Last Synced
                    {sortField === 'lastSyncAt' && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                  <th style={{ width: '10%', minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link._id}>
                    <td style={{ wordBreak: 'break-all', maxWidth: '200px' }}>
                      {/* WHAT: Bitly link as clickable external link with word-break
                       * WHY: Prevents long URLs from overflowing table, allows verification */}
                      <a 
                        href={`https://${link.bitlink}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link link-primary font-medium"
                      >
                        {link.bitlink}
                      </a>
                    </td>
                    <td style={{ wordBreak: 'break-word', maxWidth: '250px' }}>{link.title}</td>
                    <td style={{ maxWidth: '280px' }}>
                      {/* WHAT: Display associated projects as chips/bubbles
                       * WHY: Show which events this link is connected to (many-to-many) */}
                      {link.associations && link.associations.length > 0 && (
                        <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {link.associations.map((assoc) => (
                            <span
                              key={assoc.projectId}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                fontSize: '12px',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                borderRadius: '12px',
                                border: '1px solid #90caf9'
                              }}
                              title={`Clicks: ${assoc.clicks || 0} | ${assoc.autoCalculated ? 'Auto-calculated date range' : 'Manual date range'}`}
                            >
                              <span>{assoc.projectName || 'Unknown Project'}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssociation(link._id, link.bitlink, assoc.projectId, assoc.projectName)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#1976d2',
                                  cursor: 'pointer',
                                  padding: '0',
                                  fontSize: '14px',
                                  lineHeight: '1',
                                  fontWeight: 'bold',
                                  opacity: 0.7
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                title={`Remove ${assoc.projectName} from this link`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* WHAT: Always-active ProjectSelector for adding to multiple events
                       * WHY: Many-to-many support - users can quickly add link to any event
                       * PATTERN: Search and select to create new association */}
                      <ProjectSelector
                        selectedProjectId={null}
                        projects={projects}
                        onChange={(projectId) => {
                          console.log('[ProjectSelector onChange] Triggered with projectId:', projectId);
                          console.log('[ProjectSelector onChange] Link context:', { linkId: link._id, bitlink: link.bitlink });
                          if (projectId) {
                            // Add link to selected project via API
                            handleAddLinkToProject(link._id, link.bitlink, projectId);
                          } else {
                            console.log('[ProjectSelector onChange] projectId is null, skipping API call');
                          }
                        }}
                        placeholder="+ Add to event..."
                      />
                    </td>
                    <td className="stat-number">{link.click_summary.total.toLocaleString()}</td>
                    <td className="text-sm text-gray-600">
                      {formatDate(link.lastSyncAt)}
                    </td>
                    <td className="actions-cell">
                      {/* WHAT: Action buttons matching design system
                       * WHY: Consistent button styling with proper variants (info for pull, danger for archive) */}
                      <div className="action-buttons-container">
                        <button
                          onClick={() => handlePullLinkData(link._id, link.bitlink)}
                          className="btn btn-small btn-info action-button"
                          title="Emergency: Pull fresh analytics now (normally synced daily at 3 AM UTC)"
                        >
                          ⬇️ Pull
                        </button>
                        <button
                          onClick={() => handleArchiveLink(link._id)}
                          className="btn btn-small btn-danger action-button"
                          title="Archive this link"
                        >
                          🗑️ Archive
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

      {/* WHAT: Load More button for pagination
       * WHY: Allow users to load next 20 links without full page reload */}
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
          links.length > 0 && (
            <span className="text-gray-500 text-sm">No more items</span>
          )
        )}
      </div>

      {/* WHAT: Info section with standardized styling
       * WHY: Provides help text about sync operations and many-to-many system */}
      <div className="mt-6">
        <h3 className="section-title mb-4">Sync Information</h3>
        <div className="space-y-3">
          <p className="text-sm">
            <strong className="text-primary">🔄 Auto-Sync (Daily):</strong> All link analytics sync automatically every night at 3:00 AM UTC. This is the recommended way to keep data fresh.
          </p>
          <p className="text-sm">
            <strong className="text-primary">⬇️ Get Links from Bitly (Automatic):</strong> Click this button to automatically import up to 5 NEW links from your Bitly.com organization. The system fetches links, imports new ones with full analytics (clicks, geographic data, referrers, timeseries), and skips duplicates. Click multiple times if you have more than 5 links. No copy-paste needed!
          </p>
          <p className="text-sm">
            <strong className="text-primary">🔄 Sync Now (Emergency):</strong> Manually refresh analytics for all links if you need immediate updates before the next auto-sync.
          </p>
          <p className="text-sm">
            <strong className="text-primary">📊 Refresh Metrics:</strong> After syncing new Bitly data, click this to update cached analytics for all event associations. Date ranges are automatically recalculated when event dates change.
          </p>
          <p className="text-sm">
            <strong className="text-primary">⬇️ Per-Link Pull (Emergency):</strong> The ⬇️ button on each link manually refreshes that specific link&apos;s analytics. Only use if you need immediate updates for that link.
          </p>
        </div>
        
        <h3 className="section-title mt-6 mb-4">Many-to-Many Link System</h3>
        <div className="space-y-3">
          <p className="text-sm">
            <strong className="text-primary">🔗 Shared Links:</strong> Bitly links can now be associated with multiple events. Analytics are automatically split by temporal boundaries so each event gets accurate attribution.
          </p>
          <p className="text-sm">
            <strong className="text-primary">📅 Date Ranges:</strong> When a link is shared across events, the system calculates date ranges automatically. The first event gets all history, the last event gets ongoing data, and middle events get bounded ranges.
          </p>
          <p className="text-sm">
            <strong className="text-primary">♻️ Auto-Recalculation:</strong> When you change an event&apos;s date or delete an event, date ranges for affected Bitly links are automatically recalculated to maintain data integrity.
          </p>
        </div>
      </div>

      {/* WHAT: Add Link Modal matching ProjectsPageClient modal pattern
       * WHY: Consistent modal UX across admin pages; better accessibility than inline form
       * ACCESSIBILITY: ESC to close, backdrop click, focus management */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">+ Add Bitly Link</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddLink}>
              <div className="modal-body">
                <div className="form-group mb-4">
                  <label className="form-label-block">Bitly Link or URL *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newBitlink}
                    onChange={(e) => setNewBitlink(e.target.value)}
                    placeholder="bit.ly/abc123 or https://example.com/page"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Enter a Bitly short link or the original long URL
                  </p>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Assign to Project (optional)</label>
                  <select
                    className="form-input"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">-- Leave Unassigned --</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.eventName} ({new Date(project.eventDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    🔗 <strong>Many-to-Many:</strong> After adding, you can select another project to associate the same link with multiple events
                  </p>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-block">Custom Title (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Leave empty to use Bitly's title"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-small btn-secondary" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-small btn-primary"
                >
                  Add Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
