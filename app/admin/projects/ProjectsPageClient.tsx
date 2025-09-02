'use client';

import React, { useState, useEffect } from 'react';
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

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  viewSlug?: string;
  editSlug?: string;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting state
  type SortField = 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' | null;
  type SortOrder = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  
  // Modal states
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] }
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  const [showEditProjectForm, setShowEditProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectData, setEditProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[],
    categorizedHashtags: {} as { [categoryName: string]: string[] }
  });
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  // SharePopup states
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [sharePageType, setSharePageType] = useState<'stats' | 'edit' | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
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
        stats: defaultStats
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
        setNewProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {} });
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
      categorizedHashtags: project.categorizedHashtags || {}
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
        stats: editingProject.stats
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
            ? { ...p, eventName: editProjectData.eventName.trim(), eventDate: editProjectData.eventDate, hashtags: editProjectData.hashtags, categorizedHashtags: editProjectData.categorizedHashtags }
            : p
        ));
        
        setEditProjectData({ eventName: '', eventDate: '', hashtags: [], categorizedHashtags: {} });
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
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Loading projects...</div>
        </div>
      </div>
    );
  }

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
      // Search in all hashtag representations (including category-prefixed)
      const allHashtagRepresentations = getAllHashtagRepresentations({
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {}
      });
      const matchesHashtag = allHashtagRepresentations.some(
        hashtag => hashtag.toLowerCase().includes(query)
      ) || false;
      
      return matchesEventName || matchesDate || matchesHashtag;
    })
    .sort((a, b) => {
      if (!sortField || !sortOrder) return 0;
      
      let aValue: number | string = 0;
      let bValue: number | string = 0;
      
      switch (sortField) {
        case 'eventName':
          aValue = a.eventName.toLowerCase();
          bValue = b.eventName.toLowerCase();
          break;
        case 'eventDate':
          aValue = a.eventDate;
          bValue = b.eventDate;
          break;
        case 'images':
          aValue = a.stats.remoteImages + a.stats.hostessImages + a.stats.selfies;
          bValue = b.stats.remoteImages + b.stats.hostessImages + b.stats.selfies;
          break;
        case 'fans':
          aValue = a.stats.indoor + a.stats.outdoor + a.stats.stadium;
          bValue = b.stats.indoor + b.stats.outdoor + b.stats.stadium;
          break;
        case 'attendees':
          aValue = a.stats.eventAttendees || 0;
          bValue = b.stats.eventAttendees || 0;
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
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
                                    // Navigate to hashtag filter page
                                    window.open(`/hashtag/${hashtag}`, '_blank');
                                  }}
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
                                      // Navigate to hashtag filter page with category prefix
                                      window.open(`/hashtag/${hashtag}`, '_blank');
                                    }}
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
            </div>
            <div className="modal-footer" style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowNewProjectForm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  console.log('Create Project button clicked');
                  createNewProject();
                }}
                disabled={isCreatingProject}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: isCreatingProject ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: isCreatingProject ? 'not-allowed' : 'pointer'
                }}
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditProjectForm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
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
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        pageId={sharePageId || ''}
        pageType={sharePageType || 'stats'}
        customTitle={sharePageType === 'stats' ? 'Share Statistics Page' : 'Share Edit Page'}
      />
    </div>
  );
}
