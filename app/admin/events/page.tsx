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
  const [availableTemplates, setAvailableTemplates] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [availablePartners, setAvailablePartners] = useState<{ _id: string; name: string }[]>([]);
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
    styleId: '' as string | null,
    reportTemplateId: '' as string | null
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
    styleId: '' as string | null,
    reportTemplateId: '' as string | null,
    partner1Id: '' as string | null,
    partner2Id: '' as string | null
  });
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  
  // Share popup states
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [sharePageType, setSharePageType] = useState<'event-report' | 'edit' | 'filter' | null>(null);
  
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
  const loadProjects = useCallback(async (resetList = true, showLoadingSpinner = false) => {
    const q = debouncedSearchQuery.trim();
    const isSearchMode = !!q;
    
    try {
      // WHAT: Only show full loading spinner on initial page load
      // WHY: Prevent UI flash during search/sort operations
      if (showLoadingSpinner) {
        setLoading(true);
      } else if (!resetList) {
        setIsLoadingMore(true);
      }
      // Otherwise: silent fetch (no loading state change)
      
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      
      // WHAT: Always include sort params if set (works with or without search)
      // WHY: Sorting must work on initial load and during search
      if (sortField && sortOrder) {
        params.set('sortField', sortField);
        params.set('sortOrder', sortOrder);
      }
      
      // WHAT: Add search query if present
      // WHY: Search can work WITH sorting
      if (q) {
        params.set('q', q);
        console.log('🔎 API call with search + sort:', { q, sortField, sortOrder });
      } else if (sortField && sortOrder) {
        console.log('📦 API call with sort only:', sortField, sortOrder);
      } else {
        console.log('📦 API call default (no search/sort)');
      }
      
      // Always use offset 0 for first page
      params.set('offset', '0');
      
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
          const res = await fetch('/api/report-styles');
          const data = await res.json();
          if (data.success) {
            setAvailableStyles(data.styles.map((s: any) => ({ _id: s._id, name: s.name })));
          }
        } catch (e) {
          console.error('Failed to load report styles', e);
        }
      })();
      
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
      
      // Load available partners
      (async () => {
        try {
          const res = await fetch('/api/admin/partners');
          const data = await res.json();
          if (data.success) {
            setAvailablePartners(data.partners.map((p: any) => ({ _id: p._id, name: p.name })));
          }
        } catch (e) {
          console.error('Failed to load partners', e);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only run when user changes, not when loadProjects changes
  
  // WHAT: Removed auto-reload on visibility change
  // WHY: User loses pagination state when returning to tab after "Load More"
  // HOW: Users can manually refresh if needed, preserving their current view
  
  // Database search with debounce
  // WHAT: Trigger search after user stops typing
  // WHY: Prevent excessive API calls while typing
  useEffect(() => {
    console.log('🔍 Search effect triggered:', { debouncedSearchQuery, sortField, sortOrder, user: !!user });
    if (user) {
      console.log('🚀 Calling loadProjects with search:', debouncedSearchQuery);
      // WHAT: Silent fetch - no loading spinner to prevent UI flash
      // WHY: Makes search/sort feel instant without page reload
      loadProjects(true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, sortField, sortOrder, user]);
  
  // Handle sorting
  const handleSort = (field: string) => {
    const typedField = field as SortField;
    // WHAT: Three-state cycle: asc → desc → null (clear sort)
    // WHY: User can toggle through states by clicking same column
    if (sortField === typedField) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        // Clear sorting
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      // New field clicked - start with ascending
      setSortField(typedField);
      setSortOrder('asc');
    }
    
    // WHAT: Reset pagination when sort changes
    // WHY: New sort order = new result set from beginning
    setNextCursor(null);
    setSearchOffset(null);
    setSortOffset(null);
    
    // NOTE: No router.replace() - useEffect at line 238 will trigger loadProjects
    // automatically when sortField/sortOrder change. This prevents page reload.
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
      
      const payload = {
        eventName: newProjectData.eventName.trim(),
        eventDate: newProjectData.eventDate,
        hashtags: newProjectData.hashtags,
        categorizedHashtags: newProjectData.categorizedHashtags,
        stats: defaultStats,
        styleId: newProjectData.styleId || null,
        reportTemplateId: newProjectData.reportTemplateId || null
      };
      
      console.log('📤 [CREATE EVENT] Sending payload:', {
        styleId: payload.styleId,
        reportTemplateId: payload.reportTemplateId
      });
      
      const result = await apiPost('/api/projects', payload);
      
      if (result.success) {
        setProjects(prev => [result.project, ...prev]);
        setNewProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {}, styleId: '', reportTemplateId: '' });
        setShowNewProjectForm(false);
        alert(`Project \"${result.project.eventName}\" created successfully!\n\nEdit Link: /edit/${result.project.editSlug}\nReport Link: /report/${result.project.viewSlug}`);
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
    
    // WHAT: Extract partner IDs from project
    // WHY: API returns populated partner objects with nested _id, need to extract the ID
    // HOW: Check both partner object (_id) and direct partnerId field for backward compatibility
    const partner1Id = (project as any).partner1?._id || (project as any).partner1Id || '';
    const partner2Id = (project as any).partner2?._id || (project as any).partner2Id || '';
    
    setEditProjectData({
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {},
      styleId: project.styleIdEnhanced || '',
      reportTemplateId: (project as any).reportTemplateId || '',
      partner1Id,
      partner2Id
    });
    setShowEditProjectForm(true);
  };
  
  // Update project
  const updateProject = async () => {
    // WHAT: Validate required fields based on event type
    // WHY: Partner 1 is always required, Event Name required only for Type 1 (single partner events)
    if (!editingProject || !editProjectData.eventDate) {
      alert('Please fill in Event Date.');
      return;
    }
    
    if (!editProjectData.partner1Id) {
      alert('Partner 1 (Organizer / Home Team) is required.');
      return;
    }
    
    // WHAT: Auto-generate event name for Type 2 (paired matches)
    // WHY: Sports matches use "Partner1 x Partner2" format automatically
    let finalEventName = editProjectData.eventName.trim();
    if (editProjectData.partner1Id && editProjectData.partner2Id) {
      // Type 2: Paired match - auto-generate name
      const partner1 = availablePartners.find(p => p._id === editProjectData.partner1Id);
      const partner2 = availablePartners.find(p => p._id === editProjectData.partner2Id);
      if (partner1 && partner2) {
        finalEventName = `${partner1.name} x ${partner2.name}`;
      }
    } else if (!finalEventName) {
      // Type 1: Single partner event - require manual name
      alert('Event Name is required for non-match events.');
      return;
    }
    
    setIsUpdatingProject(true);
    
    try {
      const payload = {
        projectId: editingProject._id,
        eventName: finalEventName,
        eventDate: editProjectData.eventDate,
        hashtags: editProjectData.hashtags,
        categorizedHashtags: editProjectData.categorizedHashtags,
        stats: editingProject.stats,
        styleId: editProjectData.styleId || null,
        reportTemplateId: editProjectData.reportTemplateId || null,
        partner1Id: editProjectData.partner1Id || null,
        partner2Id: editProjectData.partner2Id || null
      };
      
      console.log('📤 [UPDATE EVENT] Sending payload:', {
        projectId: payload.projectId,
        styleId: payload.styleId,
        reportTemplateId: payload.reportTemplateId
      });
      
      const result = await apiPut('/api/projects', payload);
      
      if (result.success) {
        setProjects(prev => prev.map(p => 
          p._id === editingProject._id 
            ? { ...p, eventName: finalEventName, eventDate: editProjectData.eventDate, hashtags: editProjectData.hashtags, categorizedHashtags: editProjectData.categorizedHashtags, styleIdEnhanced: editProjectData.styleId || null }
            : p
        ));
        
        setEditProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {}, styleId: '', reportTemplateId: '', partner1Id: '', partner2Id: '' });
        setEditingProject(null);
        setShowEditProjectForm(false);
        
        alert(`Project \"${finalEventName}\" updated successfully!`);
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
  const handleShareOpen = (pageId: string, pageType: 'event-report' | 'edit' | 'filter') => {
    setSharePageId(pageId);
    setSharePageType(pageType);
    setSharePopupOpen(true);
  };
  
  // WHAT: Create enhanced adapter with custom action handlers
  // WHY: Override Report/Edit Stats to open share modal, Edit to open edit modal
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
        if (action.label === 'Report') {
          return {
            ...action,
            handler: (project: ProjectDTO) => {
              // WHAT: Use viewSlug for report page (stats type)
              // WHY: SharePopup needs the correct slug to generate the right URL
              const slug = project.viewSlug || project._id;
              handleShareOpen(slug, 'event-report');
            }
          };
        }
        if (action.label === 'Edit Stats') {
          return {
            ...action,
            handler: (project: ProjectDTO) => {
              // WHAT: Use editSlug for edit page (edit type)
              // WHY: SharePopup needs the correct slug to generate the right URL
              const slug = project.editSlug || project._id;
              handleShareOpen(slug, 'edit');
            }
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
        if (action.label === 'Report') {
          return {
            ...action,
            handler: (project: ProjectDTO) => {
              // WHAT: Use viewSlug for report page (stats type)
              // WHY: SharePopup needs the correct slug to generate the right URL
              const slug = project.viewSlug || project._id;
              handleShareOpen(slug, 'event-report');
            }
          };
        }
        if (action.label === 'Edit Stats') {
          return {
            ...action,
            handler: (project: ProjectDTO) => {
              // WHAT: Use editSlug for edit page (edit type)
              // WHY: SharePopup needs the correct slug to generate the right URL
              const slug = project.editSlug || project._id;
              handleShareOpen(slug, 'edit');
            }
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
          <div className="text-4xl mb-4">📅</div>
          <div className="text-gray-600">Loading events...</div>
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
        onExternalSearchChange={setSearchQuery}
        searchPlaceholder="Search events..."
        showPaginationStats={true}
        totalMatched={totalMatched}
        enableSort={true}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSort}
        actionButtons={[
          {
            label: 'Quick Add 🤝 Sports Match',
            onClick: () => router.push('/admin/quick-add'),
            variant: 'primary',
            icon: '⚡',
            title: 'Create events via match builder or bulk import'
          }
        ]}
      />
      
      {/* WHAT: Load More button for pagination
          WHY: Allow users to load additional events beyond first page */}
      {(nextCursor || searchOffset !== null || sortOffset !== null) && (
        <div className="flex-center-padded">
          <button
            className="btn btn-primary btn-min-width"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : `Load ${PAGE_SIZE} More Events`}
          </button>
        </div>
      )}
      
      {/* WHAT: End of list indicator
          WHY: Show when all events have been loaded */}
      {!nextCursor && searchOffset === null && sortOffset === null && projects.length > 0 && (
        <div className="pagination-info">
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
          <label className="form-label-block">Report Visual Style</label>
          <select 
            className="form-input"
            value={newProjectData.styleId || ''}
            onChange={(e) => setNewProjectData(prev => ({ ...prev, styleId: e.target.value || null }))}
          >
            <option value="">— Use Default Style —</option>
            {availableStyles.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <p className="form-hint">
            💡 Report color theme (26-color system for charts, hero, text)
          </p>
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label-block">Report Template</label>
          <select 
            className="form-input"
            value={newProjectData.reportTemplateId || ''}
            onChange={(e) => setNewProjectData(prev => ({ ...prev, reportTemplateId: e.target.value }))}
          >
            <option value="">— Use Partner or Default Template —</option>
            {availableTemplates.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.type})</option>
            ))}
          </select>
          <p className="form-hint">
            💡 If not set, this event will use its partner&apos;s template or the default template
          </p>
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
          {/* WHAT: Read-only Event UUID field
              WHY: Provide a stable reference ID to copy/paste when coordinating across systems
              HOW: Show MongoDB ObjectId from editingProject._id; non-editable */}
          <div className="form-group">
            <label>Event UUID</label>
            <input type="text" className="form-input" value={editingProject._id} readOnly disabled />
            <p className="form-hint">Auto-generated at creation; read-only identifier.</p>
          </div>

          <div className="form-group">
            <label>Partner 1 (Organizer / Home Team) *</label>
            <select
              className="form-input"
              value={editProjectData.partner1Id || ''}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, partner1Id: e.target.value || null }))}
            >
              <option value="">— Select Partner 1 —</option>
              {availablePartners.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <p className="form-hint">
              💡 Required: Primary organizer or home team
            </p>
          </div>
          
          {/* WHAT: Event Name field - hidden for Type 2 (paired matches)
              WHY: Sports matches auto-generate name from partners */}
          {!(editProjectData.partner1Id && editProjectData.partner2Id) && (
            <div className="form-group">
              <label>Event Name {!editProjectData.partner2Id && '*'}</label>
              <input
                type="text"
                className="form-input"
                value={editProjectData.eventName}
                onChange={(e) => setEditProjectData(prev => ({ ...prev, eventName: e.target.value }))}
                placeholder="Enter event name..."
              />
              <p className="form-hint">
                💡 Leave blank for Sports Match (auto-generated from partners)
              </p>
            </div>
          )}
          
          <div className="form-group">
            <label>Partner 2 (Away Team)</label>
            <select
              className="form-input"
              value={editProjectData.partner2Id || ''}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, partner2Id: e.target.value || null }))}
            >
              <option value="">— No Partner 2 (Single Event) —</option>
              {availablePartners.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <p className="form-hint">
              💡 Optional: For Sports Matches, set away team. Event name will be auto-generated.
            </p>
          </div>
          
          {/* WHAT: Show auto-generated name preview for Type 2 */}
          {editProjectData.partner1Id && editProjectData.partner2Id && (() => {
            const partner1 = availablePartners.find(p => p._id === editProjectData.partner1Id);
            const partner2 = availablePartners.find(p => p._id === editProjectData.partner2Id);
            if (partner1 && partner2) {
              return (
                <div className="form-group">
                  <label>Event Name (Auto-Generated)</label>
                  <div className="form-input" style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}>
                    {partner1.name} x {partner2.name}
                  </div>
                  <p className="form-hint">
                    ✅ Sports Match: Name generated automatically
                  </p>
                </div>
              );
            }
            return null;
          })()}
          
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
            <label>Report Visual Style</label>
            <select 
              className="form-input"
              value={editProjectData.styleId || ''}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, styleId: e.target.value || null }))}
            >
              <option value="">— Use Default Style —</option>
              {availableStyles.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <p className="form-hint">
              💡 Report color theme (26-color system for charts, hero, text)
            </p>
          </div>
          
          <div className="form-group">
            <label>Report Template</label>
            <select 
              className="form-input"
              value={editProjectData.reportTemplateId || ''}
              onChange={(e) => setEditProjectData(prev => ({ ...prev, reportTemplateId: e.target.value }))}
            >
              <option value="">— Use Partner or Default Template —</option>
              {availableTemplates.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.type})</option>
              ))}
            </select>
            <p className="form-hint">
              💡 If not set, this event will use its partner&apos;s template or the default template
            </p>
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
        pageType={sharePageType || 'event-report'}
        customTitle={
          sharePageType === 'event-report'
            ? 'Share Statistics Page'
            : sharePageType === 'edit'
            ? 'Share Edit Page'
            : 'Share Hashtag Filter'
        }
      />
    </>
  );
}
