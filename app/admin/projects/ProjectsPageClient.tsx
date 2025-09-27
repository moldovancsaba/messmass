'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminUser } from '@/lib/auth';
import UnifiedAdminHero from '@/components/UnifiedAdminHero';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import SharePopup from '@/components/SharePopup';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations,
  expandHashtagsWithCategories 
} from '@/lib/hashtagCategoryUtils';

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
  styleId?: string | null;
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
  const PAGE_SIZE = 20;
  
  // Sorting state
  type SortField = 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

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
    // Load styles for selection
    (async () => {
      try {
        const res = await fetch('/api/page-styles');
        const data = await res.json();
        if (data.success) {
          setAvailableStyles(data.styles.map((s: any) => ({ _id: s._id, name: s.name })));
        }
      } catch (e) {
        console.error('Failed to load styles', e);
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
        styleId: newProjectData.styleId || null
      };
      
      console.log('Sending POST request to /api/projects with:', requestBody);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
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
      styleId: project.styleId || ''
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
        styleId: editProjectData.styleId || null
      };
      
      console.log('Sending PUT request to /api/projects with:', requestBody);
      
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        setProjects(prev => prev.map(p => 
          p._id === editingProject._id 
            ? { ...p, eventName: editProjectData.eventName.trim(), eventDate: editProjectData.eventDate, hashtags: editProjectData.hashtags, categorizedHashtags: editProjectData.categorizedHashtags, styleId: editProjectData.styleId || null }
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
      const response = await fetch(`/api/projects?projectId=${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-container" style={{ padding: '1rem' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="curve-spinner"></div>
          <p style={{ color: '#6b7280', marginTop: '0.75rem' }}>Loading projects...</p>
        </div>
      </div>
    );
  }

  // Share a single-hashtag filter (generates slug, opens SharePopup)
  // WHAT: Reuse the same sharing flow as /admin/filter so that clicking a hashtag here
  //       creates a shareable URL + password and allows direct Visit from the popup.
  // WHY: Align UX between Project Management hashtag clicks and Filter page sharing.
  const shareSingleHashtag = async (hashtagValue: string, styleId: string | null) => {
    try {
      const response = await fetch('/api/filter-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags: [hashtagValue], styleId: styleId || null })
      });
      const data = await response.json();
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
    <div className="admin-container">
      {/* Use UnifiedAdminHero component matching hashtags filter page design exactly */}
      <UnifiedAdminHero
        title="Project Management"
        icon="📊"
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search projects..."
        backLink="/admin"
        actionButtons={[
          {
            label: "Add New Project",
            icon: "➕",
            onClick: () => {
              console.log('Add New Project button clicked');
              setShowNewProjectForm(true);
            },
            variant: "primary",
            title: "Create a new project"
          }
        ]}
        resultsSummary={{
          count: filteredAndSortedProjects.length,
          itemType: "project",
          additionalInfo: searchQuery ? `Filtered results` : undefined
        }}
      />

      {/* Projects Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="projects-table-container" style={{ borderRadius: 'inherit' }}>
          <table className="projects-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            borderRadius: 'inherit'
          }}>
            <thead style={{
              backgroundColor: 'rgba(102, 126, 234, 0.05)',
              borderRadius: '1rem 1rem 0 0'
            }}>
              <tr style={{
                borderRadius: '1rem 1rem 0 0'
              }}>
                <th onClick={() => handleSort('eventName')} style={{ 
                  cursor: 'pointer', 
                  position: 'relative', 
                  paddingRight: '1.5rem',
                  padding: '1rem',
                  borderTop: 'none',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'inherit'
                }}>
                  Event Name
                  {sortField === 'eventName' && (
                    <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.8rem' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('eventDate')} style={{ 
                  cursor: 'pointer', 
                  position: 'relative', 
                  paddingRight: '1.5rem',
                  padding: '1rem',
                  borderTop: 'none',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'inherit'
                }}>
                  Date
                  {sortField === 'eventDate' && (
                    <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.8rem' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('images')} style={{ 
                  cursor: 'pointer', 
                  position: 'relative', 
                  paddingRight: '1.5rem',
                  padding: '1rem',
                  borderTop: 'none',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'inherit'
                }}>
                  Images
                  {sortField === 'images' && (
                    <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.8rem' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('fans')} style={{ 
                  cursor: 'pointer', 
                  position: 'relative', 
                  paddingRight: '1.5rem',
                  padding: '1rem',
                  borderTop: 'none',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'inherit'
                }}>
                  Total Fans
                  {sortField === 'fans' && (
                    <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.8rem' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('attendees')} style={{ 
                  cursor: 'pointer', 
                  position: 'relative', 
                  paddingRight: '1.5rem',
                  padding: '1rem',
                  borderTop: 'none',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'inherit'
                }}>
                  Attendees
                  {sortField === 'attendees' && (
                    <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.8rem' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th style={{
                  padding: '1rem',
                  borderTop: 'none',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'inherit'
                }}>Actions</th>
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
                        {/* CSV export button placed before event name */}
                        <button
                          className="btn btn-sm btn-secondary"
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
                          style={{ marginRight: '0.5rem' }}
                        >
                          ⬇️ CSV
                        </button>

                        {project.viewSlug ? (
                          <button 
                            onClick={() => {
                              setSharePageId(project.viewSlug!);
                              setSharePageType('stats');
                              setSharePopupOpen(true);
                            }}
                            className="project-title-link"
                            title={`Share statistics page for ${project.eventName}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6366f1',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontFamily: 'inherit',
                              padding: 0
                            }}
                          >
                            {project.eventName}
                          </button>
                        ) : (
                          <span className="project-name-text">{project.eventName}</span>
                        )}
                        
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
                            <div className="project-hashtags" style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {displayHashtags}
                            </div>
                          ) : null;
                        })()}
                        
                        <br />
                        {project.editSlug ? (
                          <small>
                            <button 
                              onClick={() => {
                                setSharePageId(project.editSlug!);
                                setSharePageType('edit');
                                setSharePopupOpen(true);
                              }}
                              className="project-edit-link"
                              title={`Share edit page for ${project.eventName} statistics`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#059669',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                padding: 0
                              }}
                            >
                              📝 Edit Statistics
                            </button>
                          </small>
                        ) : (
                          <small className="no-edit-link">Legacy Project - No Edit Link</small>
                        )}
                      </td>
                      <td>{new Date(project.eventDate).toLocaleDateString()}</td>
                      <td className="stat-number">{images}</td>
                      <td className="stat-number">{fans}</td>
                      <td className="stat-number">{attendees}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            console.log('Edit Project button clicked for:', project.eventName);
                            editProject(project);
                          }}
                          title="Edit project name and date"
                        >
                          ✏️ Edit Project
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteProject(project._id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Load More */}
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          {searchQuery.trim() ? (
            searchOffset != null ? (
              <button className="btn btn-secondary" disabled={isLoadingMore} onClick={loadMoreSearch}>
                {isLoadingMore ? 'Loading…' : 'Load 20 more results'}
              </button>
            ) : (
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
            )
          ) : (sortField && sortOrder) ? (
            sortOffset != null ? (
              <button className="btn btn-secondary" disabled={isLoadingMore} onClick={loadMoreSort}>
                {isLoadingMore ? 'Loading…' : 'Load 20 more'}
              </button>
            ) : (
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
            )
          ) : (
            nextCursor ? (
              <button className="btn btn-secondary" disabled={isLoadingMore} onClick={loadMore}>
                {isLoadingMore ? 'Loading…' : 'Load 20 more'}
              </button>
            ) : (
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
            )
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectForm && (
        <div className="modal-overlay" onClick={() => setShowNewProjectForm(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="modal-header" style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>➕ Create New Project</h2>
              <button className="modal-close" onClick={() => setShowNewProjectForm(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.5rem'
              }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProjectData.eventName}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Enter event name..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={newProjectData.eventDate}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, eventDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hashtags</label>
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
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Page Style</label>
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
            <div className="modal-footer" style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => setShowNewProjectForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-primary" 
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
        <div className="modal-overlay" onClick={() => setShowEditProjectForm(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="modal-header" style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>✏️ Edit Project</h2>
              <button className="modal-close" onClick={() => setShowEditProjectForm(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.5rem'
              }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-sm btn-secondary" onClick={() => setShowEditProjectForm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-primary" 
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
