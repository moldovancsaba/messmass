'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminUser } from '@/lib/auth';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import SharePopup from '@/components/SharePopup';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import BitlyLinksEditor from '@/components/BitlyLinksEditor';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations,
  expandHashtagsWithCategories 
} from '@/lib/hashtagCategoryUtils';
import partnerStyles from './PartnerLogos.module.css';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
// WHAT: Server-driven sorting implementation for full-dataset ordering
// WHY: Clicking table headers must sort ALL projects, not just the visible page.
// This replaces client-only sorting with backend sort & offset pagination in search/sort modes.

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  viewSlug?: string;
  editSlug?: string;
  styleIdEnhanced?: string | null; // WHAT: Migrated from styleId to styleIdEnhanced
                                    // WHY: Align with page_styles_enhanced system
  partner1?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  partner2?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  stats: {
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    approvedImages?: number;
    rejectedImages?: number;
    visitQrCode?: number;
    visitShortUrl?: number;
    visitQrSearched?: number;
    visitWeb?: number;
    visitFacebook?: number;
    visitInstagram?: number;
    visitYoutube?: number;
    visitTiktok?: number;
    visitX?: number;
    visitTrustpilot?: number;
    eventAttendees?: number;
    eventTicketPurchases?: number;
    eventResultHome?: number;
    eventResultVisitor?: number;
    eventValuePropositionVisited?: number;
    eventValuePropositionPurchases?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectsPageClientProps {
  user: AdminUser;
}

export default function ProjectsPageClient({ user }: ProjectsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableStyles, setAvailableStyles] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchOffset, setSearchOffset] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const PAGE_SIZE = 20;
  
  // Sorting state
  // WHAT: Default sort to newest projects first (eventDate descending)
  // WHY: Users want to see most recent projects at the top by default
  type SortField = 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>('eventDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // In sort/search modes, the API uses offset-based pagination (nextOffset) instead of cursor.
  const [sortOffset, setSortOffset] = useState<number | null>(null);
  
  // Modal states
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    styleId: '' as string | null
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  const [showEditProjectForm, setShowEditProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectData, setEditProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    styleId: '' as string | null
  });
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  // SharePopup states
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [sharePageType, setSharePageType] = useState<'stats' | 'edit' | 'filter' | null>(null);

  // Hydrate sort state from URL (if present)
  useEffect(() => {
    const sf = searchParams?.get('sortField') as SortField | null;
    const so = searchParams?.get('sortOrder') as SortOrder | null;
    const allowedFields: SortField[] = ['eventName', 'eventDate', 'images', 'fans', 'attendees'];
    const allowedOrders: SortOrder[] = ['asc', 'desc'];
    if (sf && allowedFields.includes(sf)) setSortField(sf);
    if (so && allowedOrders.includes(so)) setSortOrder(so);
  }, [searchParams]);

  const loadProjects = useCallback(async () => {
    try {
      // Decide mode by presence of sort/search
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
        params.set('offset', '0'); // first page in sort mode
      }
      const response = await fetch(`/api/projects?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
        // Cursor mode only when no sort/search
        setNextCursor(data.pagination?.mode === 'cursor' ? (data.pagination?.nextCursor || null) : null);
        setSearchOffset(data.pagination?.mode === 'search' ? (data.pagination?.nextOffset ?? null) : null);
        setSortOffset(data.pagination?.mode === 'sort' ? (data.pagination?.nextOffset ?? null) : null);
        setTotalMatched(data.pagination?.totalMatched ?? data.projects.length);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    loadProjects();
    // WHAT: Load styles from page_styles_enhanced API
    // WHY: Migrated from old /api/page-styles to new enhanced system
    (async () => {
      try {
        const res = await fetch('/api/page-styles-enhanced');
        const data = await res.json();
        if (data.success) {
          setAvailableStyles(data.styles.map((s: any) => ({ _id: s._id, name: s.name })));
        }
      } catch (e) {
        console.error('Failed to load enhanced styles', e);
      }
    })();
  }, [loadProjects]);


  // Server-side search across all projects
  useEffect(() => {
    const handler = setTimeout(async () => {
      const q = searchQuery.trim();
      if (!q) {
        // Reset to default list
        setLoading(true);
        setProjects([]);
        setNextCursor(null);
        setSearchOffset(0);
        await loadProjects();
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/projects?q=${encodeURIComponent(q)}&offset=0&limit=${PAGE_SIZE}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects);
          setSearchOffset(data.pagination?.nextOffset ?? null);
          setNextCursor(null); // not used in search mode
          setTotalMatched(data.pagination?.totalMatched ?? data.projects.length);
        }
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, loadProjects]);

  const handleSort = (field: SortField) => {
    // WHAT: Three-state cycle per column: asc → desc → clear
    // WHY: Matches UX expectation and toggles between server-side sort and default cursor mode
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
    // Reset offsets when sort changes so we start from the first page
    setNextCursor(null);
    setSearchOffset(null);
    setSortOffset(null);
    setLoading(true);
    // Sync to URL query for shareable state
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

    // Trigger reload with new sort
    setTimeout(loadProjects, 0);
  };

  const createNewProject = async () => {
    console.log('Creating new project with data:', newProjectData);
    
    if (!newProjectData.eventName.trim() || !newProjectData.eventDate) {
      alert('Please fill in both Event Name and Event Date.');
      return;
    }

    setIsCreatingProject(true);
    
    try {
      const defaultStats = {
        remoteImages: 0, hostessImages: 0, selfies: 0, indoor: 0, outdoor: 0, stadium: 0,
        female: 0, male: 0, genAlpha: 0, genYZ: 0, genX: 0, boomer: 0, merched: 0,
        jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0, approvedImages: 0,
        rejectedImages: 0, visitQrCode: 0, visitShortUrl: 0, visitWeb: 0, visitFacebook: 0,
        visitInstagram: 0, visitYoutube: 0, visitTiktok: 0, visitX: 0, visitTrustpilot: 0,
        eventAttendees: 0, eventTicketPurchases: 0, eventResultHome: 0, eventResultVisitor: 0,
        eventValuePropositionVisited: 0, eventValuePropositionPurchases: 0
      };

      const requestBody = {
        eventName: newProjectData.eventName.trim(),
        eventDate: newProjectData.eventDate,
        hashtags: newProjectData.hashtags,
        categorizedHashtags: newProjectData.categorizedHashtags,
        stats: defaultStats,
        styleId: newProjectData.styleId || null // WHAT: API param still named styleId (backend converts to styleIdEnhanced)
      };
      
      console.log('Sending POST request to /api/projects with:', requestBody);
      
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const result = await apiPost('/api/projects', requestBody);
      console.log('Response data:', result);

      if (result.success) {
        setProjects(prev => [result.project, ...prev]);
        setNewProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {}, styleId: '' });
        setShowNewProjectForm(false);
        
        alert(`Project "${result.project.eventName}" created successfully!\n\nEdit Link: /edit/${result.project.editSlug}\nStats Link: /stats/${result.project.viewSlug}`);
      } else {
        alert(`Failed to create project: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectData({
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {},
      styleId: project.styleIdEnhanced || '' // WHAT: Read from styleIdEnhanced field
                                             // WHY: Migrated to page_styles_enhanced system
    });
    setShowEditProjectForm(true);
  };

  const updateProject = async () => {
    console.log('Updating project with data:', editProjectData, 'for project:', editingProject?._id);
    
    if (!editingProject || !editProjectData.eventName.trim() || !editProjectData.eventDate) {
      alert('Please fill in both Event Name and Event Date.');
      return;
    }

    setIsUpdatingProject(true);
    
    try {
      const requestBody = {
        projectId: editingProject._id,
        eventName: editProjectData.eventName.trim(),
        eventDate: editProjectData.eventDate,
        hashtags: editProjectData.hashtags,
        categorizedHashtags: editProjectData.categorizedHashtags,
        stats: editingProject.stats,
        styleId: editProjectData.styleId || null // WHAT: API param still named styleId (backend converts to styleIdEnhanced)
      };
      
      console.log('Sending PUT request to /api/projects with:', requestBody);
      
      // WHAT: Use apiPut() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const result = await apiPut('/api/projects', requestBody);
      console.log('Response data:', result);

      if (result.success) {
        setProjects(prev => prev.map(p => 
          p._id === editingProject._id 
            ? { ...p, eventName: editProjectData.eventName.trim(), eventDate: editProjectData.eventDate, hashtags: editProjectData.hashtags, categorizedHashtags: editProjectData.categorizedHashtags, styleIdEnhanced: editProjectData.styleId || null }
            : p
        ));
        
        setEditProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {}, styleId: '' });
        setEditingProject(null);
        setShowEditProjectForm(false);
        
        alert(`Project "${editProjectData.eventName}" updated successfully!`);
      } else {
        alert(`Failed to update project: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      // WHAT: Use apiDelete() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const result = await apiDelete(`/api/projects?projectId=${projectId}`);

      if (result.success) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="curve-spinner"></div>
          <p className="text-gray-500 mt-3">Loading projects...</p>
        </ColoredCard>
      </div>
    );
  }

  // Share a single-hashtag filter (generates slug, opens SharePopup)
  // WHAT: Reuse the same sharing flow as /admin/filter so that clicking a hashtag here
  //       creates a shareable URL + password and allows direct Visit from the popup.
  // WHY: Align UX between Project Management hashtag clicks and Filter page sharing.
  const shareSingleHashtag = async (hashtagValue: string, styleId: string | null) => {
    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPost('/api/filter-slug', {
        hashtags: [hashtagValue],
        styleId: styleId || null
      });
      if (data.success) {
        setSharePageId(data.slug);
        setSharePageType('filter');
        setSharePopupOpen(true);
      } else {
        alert('Failed to generate shareable link: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error generating filter slug:', e);
      alert('Failed to generate shareable link');
    }
  };

  // Load more for default cursor list (no sort/no search)
  const loadMore = async () => {
    if (!nextCursor || isLoadingMore || isSearching || (sortField && sortOrder)) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/projects?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => {
          const existing = new Set(prev.map((p: Project) => p._id));
          const merged = [...prev];
          for (const p of data.projects as Project[]) {
            if (!existing.has(p._id)) merged.push(p);
          }
          return merged;
        });
        setNextCursor(data.pagination?.nextCursor || null);
      }
    } catch (e) {
      console.error('Failed to load more projects', e);
    } finally {
      setIsLoadingMore(false);
    }
  };


  const loadMoreSearch = async () => {
    if (!isSearching && searchQuery.trim() && searchOffset != null) {
      setIsLoadingMore(true);
      try {
        const res = await fetch(`/api/projects?q=${encodeURIComponent(searchQuery.trim())}&offset=${searchOffset}&limit=${PAGE_SIZE}` , { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setProjects(prev => {
            const existing = new Set(prev.map((p: Project) => p._id));
            const merged = [...prev];
            for (const p of data.projects as Project[]) {
              if (!existing.has(p._id)) merged.push(p);
            }
            return merged;
          });
          setSearchOffset(data.pagination?.nextOffset ?? null);
        }
      } catch (e) {
        console.error('Load more search results failed', e);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Load more for sort mode (no search, explicit sortField/sortOrder)
  const loadMoreSort = async () => {
    if (!searchQuery.trim() && sortField && sortOrder && sortOffset != null && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(sortOffset));
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
        const res = await fetch(`/api/projects?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setProjects(prev => {
            const existing = new Set(prev.map((p: Project) => p._id));
            const merged = [...prev];
            for (const p of data.projects as Project[]) {
              if (!existing.has(p._id)) merged.push(p);
            }
            return merged;
          });
          setSortOffset(data.pagination?.nextOffset ?? null);
        }
      } catch (e) {
        console.error('Load more sort results failed', e);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // IMPORTANT: The backend now handles sorting and (when searching) filtering order across the full dataset.
  // We keep only a lightweight filter here to hide non-matching items in the current page when not using the server search input.
  // Sorting is REMOVED client-side to avoid diverging from server order.
  const filteredAndSortedProjects = projects
    .filter((project) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase().trim();
      const matchesEventName = project.eventName.toLowerCase().includes(query);
      const dateString = new Date(project.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).toLowerCase();
      const isoDateString = project.eventDate.toLowerCase();
      const matchesDate = dateString.includes(query) || isoDateString.includes(query);
      const allHashtagRepresentations = getAllHashtagRepresentations({
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {}
      });
      const matchesHashtag = allHashtagRepresentations.some(
        hashtag => hashtag.toLowerCase().includes(query)
      ) || false;
      return matchesEventName || matchesDate || matchesHashtag;
    });

  return (
    <div className="page-container">
      {/* WHAT: AdminHero standardization for consistent header
          WHY: Unified design system across all admin pages */}
      <AdminHero
        title="🍿 Manage Projects"
        subtitle="Manage all event projects, statistics, and sharing options"
        backLink="/admin"
        showSearch
        searchValue={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        searchPlaceholder="Search projects..."
        actionButtons={[
          {
            label: 'Add New Project',
            icon: '➕',
            onClick: () => {
              console.log('Add New Project button clicked');
              setShowNewProjectForm(true);
            },
            variant: 'primary',
            title: 'Create a new project'
          }
        ]}
      />
      
      {/* WHAT: Pagination stats header showing X of Y items
       * WHY: Consistent format across all admin pages (Categories, Users, Hashtags) */}
      {!loading && projects.length > 0 && (
        <div className={partnerStyles.paginationStats}>
          <div className={partnerStyles.paginationText}>
            Showing {projects.length} of {totalMatched} projects
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="projects-table-container">
        <div className="table-overflow-hidden">
          <table className="projects-table table-full-width table-inherit-radius">
            <thead>
              <tr>
                <th onClick={() => handleSort('eventName')} className="sortable-th">
                  Event Name
                  {sortField === 'eventName' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('eventDate')} className="sortable-th">
                  Date
                  {sortField === 'eventDate' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('images')} className="sortable-th">
                  Images
                  {sortField === 'images' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('fans')} className="sortable-th">
                  Total Fans
                  {sortField === 'fans' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('attendees')} className="sortable-th">
                  Attendees
                  {sortField === 'attendees' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    <div className="admin-empty-icon">📊</div>
                    <div className="admin-empty-title">No Projects Found</div>
                    <div className="admin-empty-subtitle">
                      {projects.length === 0 
                        ? "No projects have been created yet. Create your first project to get started."
                        : "No projects match your search criteria."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedProjects.map((project) => {
                  const fans = project.stats.indoor + project.stats.outdoor + project.stats.stadium;
                  const images = project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies;
                  const attendees = project.stats.eventAttendees || 0;
                  
                  return (
                    <tr key={project._id}>
                      <td className="project-name">
                        {/* WHAT: Sports Match layout with emoji and partner logos
                         * WHY: Match partner management style, show team logos for Sports Match projects */}
                        <div className={partnerStyles.partnerRow}>
                          {/* WHAT: Standalone emoji matching partner management size */}
                          {project.partner1 && (
                            <span className={partnerStyles.partnerEmoji}>
                              {project.partner1.emoji}
                            </span>
                          )}
                          
                          {/* WHAT: Partner 1 (Home Team) logo */}
                          {project.partner1?.logoUrl ? (
                            <img
                              src={project.partner1.logoUrl}
                              alt={`${project.partner1.name} logo`}
                              className={partnerStyles.partnerLogo}
                              title={project.partner1.name}
                            />
                          ) : project.partner1 ? (
                            <div className={partnerStyles.partnerLogoPlaceholder} />
                          ) : null}
                          
                          {/* WHAT: Event name as clickable button */}
                          {project.viewSlug ? (
                            <button 
                              onClick={() => {
                                setSharePageId(project.viewSlug!);
                                setSharePageType('stats');
                                setSharePopupOpen(true);
                              }}
                              className={`btn btn-small btn-success ${partnerStyles.eventName}`}
                              title={`Share statistics page for ${project.eventName}`}
                            >
                              {project.eventName}
                            </button>
                          ) : (
                            <span className={`project-name-text ${partnerStyles.eventName}`}>
                              {project.eventName}
                            </span>
                          )}
                          
                          {/* WHAT: Partner 2 (Away Team) logo */}
                          {project.partner2?.logoUrl ? (
                            <img
                              src={project.partner2.logoUrl}
                              alt={`${project.partner2.name} logo`}
                              className={partnerStyles.partnerLogo}
                              title={project.partner2.name}
                            />
                          ) : project.partner2 ? (
                            <div className={partnerStyles.partnerLogoPlaceholder} />
                          ) : null}
                        </div>
                        
                        {(() => {
                          const displayHashtags: React.ReactElement[] = [];
                          
                          // Add traditional hashtags (as-is)
                          if (project.hashtags && project.hashtags.length > 0) {
                            project.hashtags.forEach(hashtag => {
                              displayHashtags.push(
                                <ColoredHashtagBubble 
                                  key={`general-${hashtag}`}
                                  hashtag={hashtag}
                                  small={true}
                                  interactive={true}
                                  onClick={(hashtag) => {
                                    // Open share popup for single-hashtag filter (same flow as Admin → Filter)
                                    shareSingleHashtag(hashtag, project.styleId || null);
                                  }}
                                  projectCategorizedHashtags={project.categorizedHashtags}
                                  autoResolveColor={true}
                                />
                              );
                            });
                          }
                          
                          // Add categorized hashtags with category prefix
                          if (project.categorizedHashtags) {
                            Object.entries(project.categorizedHashtags).forEach(([category, hashtags]) => {
                              hashtags.forEach(hashtag => {
                                displayHashtags.push(
                                  <ColoredHashtagBubble 
                                    key={`${category}-${hashtag}`}
                                    hashtag={`${category}:${hashtag}`}
                                    showCategoryPrefix={true}
                                    small={true}
                                    interactive={true}
                                    onClick={(hashtag) => {
                                      // Open share popup for category-prefixed single-hashtag filter
                                      shareSingleHashtag(hashtag, project.styleId || null);
                                    }}
                                    projectCategorizedHashtags={project.categorizedHashtags}
                                    autoResolveColor={true}
                                  />
                                );
                              });
                            });
                          }
                          
                          return displayHashtags.length > 0 ? (
                            <div className="project-hashtags mt-05 flex flex-wrap gap-025">
                              {displayHashtags}
                            </div>
                          ) : null;
                        })()}
                      </td>
                      <td>{new Date(project.eventDate).toLocaleDateString()}</td>
                      <td className="stat-number">{images}</td>
                      <td className="stat-number">{fans}</td>
                      <td className="stat-number">{attendees}</td>
                      <td className="actions-cell">
                        {/* WHAT: All action buttons grouped in Actions column
                         * WHY: Consistent with other admin pages - all actions in one place on the right */}
                        <div className="action-buttons-container">
                          {/* CSV Export Button */}
                          <button
                            className="btn btn-small btn-info action-button"
                            title={`Download CSV for ${project.eventName}`}
                            onClick={async () => {
                              try {
                                const timestamp = new Date().getTime();
                                const id = project.viewSlug || project._id;
                                const res = await fetch(`/api/projects/stats/${id}?refresh=${timestamp}`);
                                const data = await res.json();
                                if (!data.success || !data.project) {
                                  alert('Failed to fetch project stats for CSV export');
                                  return;
                                }
                                const p = data.project;
                                const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
                                const rows: Array<[string, string | number]> = [];
                                rows.push(['Event Name', p.eventName]);
                                rows.push(['Event Date', p.eventDate]);
                                rows.push(['Created At', p.createdAt]);
                                rows.push(['Updated At', p.updatedAt]);
                                Object.entries(p.stats || {}).forEach(([k, v]) => {
                                  rows.push([k, typeof v === 'number' || typeof v === 'string' ? v : '']);
                                });
                                const header = ['Variable', 'Value'];
                                const csv = [header, ...rows].map(([k, v]) => `${esc(k)},${esc(v)}`).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                const base = p.eventName.replace(/[^a-zA-Z0-9]/g, '_') || 'event';
                                const url = URL.createObjectURL(blob);
                                link.setAttribute('href', url);
                                link.setAttribute('download', `${base}_variables.csv`);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } catch (e) {
                                alert('Export failed');
                              }
                            }}
                          >
                            ⬇️ CSV
                          </button>
                          
                          {/* Edit Statistics Share Button */}
                          {project.editSlug && (
                            <button
                              className="btn btn-small btn-success action-button"
                              onClick={() => {
                                setSharePageId(project.editSlug!);
                                setSharePageType('edit');
                                setSharePopupOpen(true);
                              }}
                              title={`Share edit page for ${project.eventName} statistics`}
                            >
                              📝 Edit Stats
                            </button>
                          )}
                          
                          {/* Edit Project Button */}
                          <button 
                            className="btn btn-small btn-primary action-button"
                            onClick={() => {
                              console.log('Edit Project button clicked for:', project.eventName);
                              editProject(project);
                            }}
                            title="Edit project name and date"
                          >
                            ✏️ Edit
                          </button>
                          
                          {/* Delete Project Button */}
                          <button 
                            className="btn btn-small btn-danger action-button"
                            onClick={() => deleteProject(project._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Load More */}
      <div className="p-4 text-center">
          {searchQuery.trim() ? (
            searchOffset != null ? (
              <button className="btn btn-small btn-secondary" disabled={isLoadingMore} onClick={loadMoreSearch}>
                {isLoadingMore ? 'Loading…' : 'Load 20 more results'}
              </button>
            ) : (
              <span className="text-gray-500 text-sm">No more items</span>
            )
          ) : (sortField && sortOrder) ? (
            sortOffset != null ? (
              <button className="btn btn-small btn-secondary" disabled={isLoadingMore} onClick={loadMoreSort}>
                {isLoadingMore ? 'Loading…' : 'Load 20 more'}
              </button>
            ) : (
              <span className="text-gray-500 text-sm">No more items</span>
            )
          ) : (
            nextCursor ? (
              <button className="btn btn-small btn-secondary" disabled={isLoadingMore} onClick={loadMore}>
                {isLoadingMore ? 'Loading…' : 'Load 20 more'}
              </button>
            ) : (
              <span className="text-gray-500 text-sm">No more items</span>
            )
          )}
      </div>

      {/* New Project Modal */}
      {showNewProjectForm && (
        <div className="modal-overlay" onClick={() => setShowNewProjectForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">➕ Create New Project</h2>
              <button className="modal-close" onClick={() => setShowNewProjectForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group mb-4">
                <label className="form-label-block">Event Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProjectData.eventName}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Enter event name..."
                />
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label-block">Event Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={newProjectData.eventDate}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label-block">Hashtags</label>
                <UnifiedHashtagInput
                  generalHashtags={newProjectData.hashtags}
                  onGeneralChange={(hashtags) => 
                    setNewProjectData(prev => ({ ...prev, hashtags }))
                  }
                  categorizedHashtags={newProjectData.categorizedHashtags}
                  onCategorizedChange={(categorizedHashtags) => 
                    setNewProjectData(prev => ({ ...prev, categorizedHashtags }))
                  }
                  placeholder="Search or add hashtags..."
                />
              </div>
              {/* Style selection */}
              <div className="form-group mb-4">
                <label className="form-label-block">Page Style</label>
                <select 
                  className="form-input"
                  value={newProjectData.styleId || ''}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, styleId: e.target.value }))}
                >
                  <option value="">— Use Default/Global —</option>
                  {availableStyles.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-small btn-secondary" 
                onClick={() => setShowNewProjectForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-small btn-primary" 
                onClick={() => {
                  console.log('Create Project button clicked');
                  createNewProject();
                }}
                disabled={isCreatingProject}
              >
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectForm && editingProject && (
        <div className="modal-overlay" onClick={() => setShowEditProjectForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Project</h2>
              <button className="modal-close" onClick={() => setShowEditProjectForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editProjectData.eventName}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Enter event name..."
                />
              </div>
              
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={editProjectData.eventDate}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Hashtags</label>
                <UnifiedHashtagInput
                  generalHashtags={editProjectData.hashtags}
                  onGeneralChange={(hashtags) => 
                    setEditProjectData(prev => ({ ...prev, hashtags }))
                  }
                  categorizedHashtags={editProjectData.categorizedHashtags}
                  onCategorizedChange={(categorizedHashtags) => 
                    setEditProjectData(prev => ({ ...prev, categorizedHashtags }))
                  }
                  placeholder="Search or add hashtags..."
                />
              </div>
              {/* Style selection */}
              <div className="form-group">
                <label>Page Style</label>
                <select 
                  className="form-input"
                  value={editProjectData.styleId || ''}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, styleId: e.target.value }))}
                >
                  <option value="">— Use Default/Global —</option>
                  {availableStyles.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              {/* WHAT: Bitly Links Management Section */}
              {/* WHY: Allows admins to connect Bitly links directly from project edit modal */}
              <div className="form-group">
                <BitlyLinksEditor projectId={editingProject._id} projectName={editingProject.eventName} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-small btn-secondary" onClick={() => setShowEditProjectForm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-small btn-primary" 
                onClick={updateProject}
                disabled={isUpdatingProject}
              >
                {isUpdatingProject ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Popup */}
      <SharePopup
        key={`${sharePageType}:${sharePageId}`}
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        pageId={sharePageId || ''}
        pageType={sharePageType || 'stats'}
        customTitle={
          sharePageType === 'stats'
            ? 'Share Statistics Page'
            : sharePageType === 'edit'
            ? 'Share Edit Page'
            : 'Share Hashtag Filter'
        }
      />
    </div>
  );
}
