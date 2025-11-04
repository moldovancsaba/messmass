'use client';

// WHAT: Unified Projects page with database-only search
// WHY: Eliminate dual search logic, use UnifiedAdminPage system for consistency
// FEATURES: Card/list toggle, server-side search/sort, modal CRUD, CSV export, share functionality

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { projectsAdapter } from '@/lib/adapters/projectsAdapter';
import { ProjectDTO } from '@/lib/types/api';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import FormModal from '@/components/modals/FormModal';
import SharePopup from '@/components/SharePopup';
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
import MaterialIcon from '@/components/MaterialIcon';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import BitlyLinksEditor from '@/components/BitlyLinksEditor';

const PAGE_SIZE = 20;

export default function ProjectsPageUnified() {
  const { user, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data state
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [availableStyles, setAvailableStyles] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchOffset, setSearchOffset] = useState<number | null>(null);
  const [sortOffset, setSortOffset] = useState<number | null>(null);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  
  // Sorting state
  type SortField = 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>('eventDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Modal states - Create
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    styleId: '' as string | null
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  // Modal states - Edit
  const [showEditProjectForm, setShowEditProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDTO | null>(null);
  const [editProjectData, setEditProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] },
    styleId: '' as string | null
  });
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  
  // Share popup states
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [sharePageType, setSharePageType] = useState<'stats' | 'edit' | 'filter' | null>(null);
  
  // Hydrate sort state from URL
  useEffect(() => {
    const sf = searchParams?.get('sortField') as SortField | null;
    const so = searchParams?.get('sortOrder') as SortOrder | null;
    const allowedFields: SortField[] = ['eventName', 'eventDate', 'images', 'fans', 'attendees'];
    const allowedOrders: SortOrder[] = ['asc', 'desc'];
    if (sf && allowedFields.includes(sf)) setSortField(sf);
    if (so && allowedOrders.includes(so)) setSortOrder(so);
  }, [searchParams]);
  
  // WHAT: Load projects with database-only logic (no client-side filtering)
  // WHY: Fix search issues by using only server-side search/sort/pagination
  const loadProjects = useCallback(async (resetList = true) => {
    const q = debouncedSearchQuery.trim();
    const isSearchMode = !!q;
    
    try {
      // Don't show full loading spinner during search typing
      if (isSearchMode) {
        // Keep existing UI, just mark as searching
      } else {
        if (resetList) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }
      }
      
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      
      // Server-side search
      if (q) {
        params.set('q', q);
        params.set('offset', '0');
        console.log('🔎 API call with search:', q, 'URL:', `/api/projects?${params.toString()}`);
      } else if (sortField && sortOrder) {
        // Server-side sorting
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
        params.set('offset', '0');
        console.log('📦 API call with sort:', sortField, sortOrder);
      } else {
        console.log('📦 API call default (no search/sort)');
      }
      
      const response = await fetch(`/api/projects?${params.toString()}`, { cache: 'no-store' });
      console.log('✅ API response received, success:', response.ok);
      const data = await response.json();
      
      if (data.success) {
        if (resetList) {
          setProjects(data.projects);
        } else {
          // WHAT: Append to existing list for Load More
          setProjects(prev => [...prev, ...data.projects]);
        }
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
      setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery, sortField, sortOrder]);
  
  // WHAT: Load more events handler
  // WHY: Pagination support to load next page of results
  const handleLoadMore = async () => {
    const q = debouncedSearchQuery.trim();
    setIsLoadingMore(true);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      
      // Determine which pagination mode to use
      if (q && searchOffset !== null) {
        // Search mode with offset
        params.set('q', q);
        params.set('offset', String(searchOffset));
      } else if (sortField && sortOrder && sortOffset !== null) {
        // Sort mode with offset
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
        params.set('offset', String(sortOffset));
      } else if (nextCursor) {
        // Default cursor mode
        params.set('cursor', nextCursor);
      } else {
        // No more results
        return;
      }
      
      const response = await fetch(`/api/projects?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        setProjects(prev => [...prev, ...data.projects]);
        setNextCursor(data.pagination?.mode === 'cursor' ? (data.pagination?.nextCursor || null) : null);
        setSearchOffset(data.pagination?.mode === 'search' ? (data.pagination?.nextOffset ?? null) : null);
        setSortOffset(data.pagination?.mode === 'sort' ? (data.pagination?.nextOffset ?? null) : null);
      }
    } catch (error) {
      console.error('Failed to load more projects:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Initial load - only on mount when user becomes available
  useEffect(() => {
    if (user) {
      // Load available styles
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only run when user changes, not when loadProjects changes
  
  // Auto-reload on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProjects();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadProjects]);
  
  // Database search with debounce
  // WHAT: Trigger search after user stops typing
  // WHY: Prevent excessive API calls while typing
  useEffect(() => {
    console.log('🔍 Search effect triggered:', { debouncedSearchQuery, sortField, sortOrder, user: !!user });
    if (user) {
      console.log('🚀 Calling loadProjects with search:', debouncedSearchQuery);
      loadProjects(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, sortField, sortOrder, user]);
  
  // Handle sorting
  const handleSort = (field: string) => {
    const typedField = field as SortField;
    if (sortField === typedField) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(typedField);
      setSortOrder('asc');
    }
    setNextCursor(null);
    setSearchOffset(null);
    setSortOffset(null);
    setLoading(true);
    
    // Sync to URL
    const params = new URLSearchParams(Array.from(searchParams?.entries() || []));
    const currentField = sortField;
    const currentOrder = sortOrder;
    let nextField: SortField = typedField;
    let nextOrder: SortOrder = 'asc';
    if (currentField === typedField) {
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
    
    setTimeout(() => loadProjects(true), 0);
  };
  
  // Create project
  const createNewProject = async () => {
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
      
      const result = await apiPost('/api/projects', {
        eventName: newProjectData.eventName.trim(),
        eventDate: newProjectData.eventDate,
        hashtags: newProjectData.hashtags,
        categorizedHashtags: newProjectData.categorizedHashtags,
        stats: defaultStats,
        styleId: newProjectData.styleId || null
      });
      
      if (result.success) {
        setProjects(prev => [result.project, ...prev]);
        setNewProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {}, styleId: '' });
        setShowNewProjectForm(false);
        alert(`Project \"${result.project.eventName}\" created successfully!\n\nEdit Link: /edit/${result.project.editSlug}\nStats Link: /stats/${result.project.viewSlug}`);
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
  
  // Edit project
  const editProject = (project: ProjectDTO) => {
    setEditingProject(project);
    setEditProjectData({
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {},
      styleId: project.styleIdEnhanced || ''
    });
    setShowEditProjectForm(true);
  };
  
  // Update project
  const updateProject = async () => {
    if (!editingProject || !editProjectData.eventName.trim() || !editProjectData.eventDate) {
      alert('Please fill in both Event Name and Event Date.');
      return;
    }
    
    setIsUpdatingProject(true);
    
    try {
      const result = await apiPut('/api/projects', {
        projectId: editingProject._id,
        eventName: editProjectData.eventName.trim(),
        eventDate: editProjectData.eventDate,
        hashtags: editProjectData.hashtags,
        categorizedHashtags: editProjectData.categorizedHashtags,
        stats: editingProject.stats,
        styleId: editProjectData.styleId || null
      });
      
      if (result.success) {
        setProjects(prev => prev.map(p => 
          p._id === editingProject._id 
            ? { ...p, eventName: editProjectData.eventName.trim(), eventDate: editProjectData.eventDate, hashtags: editProjectData.hashtags, categorizedHashtags: editProjectData.categorizedHashtags, styleIdEnhanced: editProjectData.styleId || null }
            : p
        ));
        
        setEditProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {}, styleId: '' });
        setEditingProject(null);
        setShowEditProjectForm(false);
        
        alert(`Project \"${editProjectData.eventName}\" updated successfully!`);
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
  
  // Delete project
  const handleDeleteSuccess = (projectId: string) => {
    setProjects(prev => prev.filter(p => p._id !== projectId));
  };
  
  // Share handlers
  const handleShareOpen = (pageId: string, pageType: 'stats' | 'edit' | 'filter') => {
    setSharePageId(pageId);
    setSharePageType(pageType);
    setSharePopupOpen(true);
  };
  
  // WHAT: Create enhanced adapter with custom Edit handler
  // WHY: Override default Edit action to open modal instead of logging
  // NOTE: Must be called before any early returns (React Hooks rules)
  const enhancedAdapter = React.useMemo(() => ({
    ...projectsAdapter,
    listConfig: {
      ...projectsAdapter.listConfig,
      rowActions: projectsAdapter.listConfig.rowActions?.map(action => {
        if (action.label === 'Edit') {
          return {
            ...action,
            handler: (project: ProjectDTO) => editProject(project)
          };
        }
        return action;
      })
    },
    cardConfig: {
      ...projectsAdapter.cardConfig,
      cardActions: projectsAdapter.cardConfig.cardActions?.map(action => {
        if (action.label === 'Edit') {
          return {
            ...action,
            handler: (project: ProjectDTO) => editProject(project)
          };
        }
        return action;
      })
    }
  }), []);
  
  // Loading state
  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">📁</div>
          <div className="text-gray-600">Loading projects...</div>
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
        adapter={enhancedAdapter}
        items={projects}
        isLoading={loading}
        title="📅 Manage Events"
        subtitle="Manage all events, statistics, and sharing options"
        backLink="/admin"
        enableSearch={true}
        externalSearchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search events..."
        showPaginationStats={true}
        totalMatched={totalMatched}
        enableSort={true}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSort}
        actionButtons={[
          {
            label: 'Add New Event',
            onClick: () => setShowNewProjectForm(true),
            variant: 'primary',
            icon: '➕',
            title: 'Create a new event'
          }
        ]}
      />
      
      {/* WHAT: Load More button for pagination
          WHY: Allow users to load additional events beyond first page */}
      {(nextCursor || searchOffset !== null || sortOffset !== null) && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--mm-space-6)', marginTop: 'var(--mm-space-4)' }}>
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="btn btn-secondary"
            style={{ minWidth: '200px' }}
          >
            {isLoadingMore ? 'Loading...' : `Load ${PAGE_SIZE} More Events`}
          </button>
        </div>
      )}
      
      {/* WHAT: End of list indicator
          WHY: Show when all events have been loaded */}
      {!nextCursor && searchOffset === null && sortOffset === null && projects.length > 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--mm-space-6)', color: 'var(--mm-gray-600)' }}>
          — All {totalMatched} events loaded —
        </div>
      )}
      
      {/* Create Event Modal */}
      <FormModal
        isOpen={showNewProjectForm}
        onClose={() => setShowNewProjectForm(false)}
        onSubmit={createNewProject}
        title="➕ Create New Event"
        submitText="Create Event"
        isSubmitting={isCreatingProject}
        size="lg"
      >
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
      </FormModal>
      
      {/* Edit Event Modal */}
      {editingProject && (
        <FormModal
          isOpen={showEditProjectForm}
          onClose={() => setShowEditProjectForm(false)}
          onSubmit={updateProject}
          title="✏️ Edit Event"
          submitText="Update Event"
          isSubmitting={isUpdatingProject}
          size="lg"
        >
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
          
          <div className="form-group">
            <BitlyLinksEditor projectId={editingProject._id} projectName={editingProject.eventName} />
          </div>
        </FormModal>
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
    </>
  );
}
