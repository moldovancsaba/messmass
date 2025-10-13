// app/admin/bitly/page.tsx
// WHAT: Admin interface for managing Bitly link associations
// WHY: Provides visual UI for connecting Bitly URLs to MessMass projects
// USER WORKFLOW: Click to add links, view analytics, reassign between projects

'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// WHAT: Type definitions for links and projects
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
}

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
}

export default function BitlyAdminPage() {
  // WHAT: Component state management
  // WHY: Tracks links, projects, UI state, and user inputs
  const [links, setLinks] = useState<BitlyLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // WHAT: Form state for adding new links
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBitlink, setNewBitlink] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');

  // WHAT: Fetch links and projects on component mount
  // WHY: Populates the management interface with current data
  useEffect(() => {
    loadData();
  }, []);

  // WHAT: Load both links and projects from API
  async function loadData() {
    try {
      setLoading(true);
      setError('');

      // WHAT: Fetch projects for dropdown selection
      const projectsRes = await fetch('/api/projects');
      const projectsData = await projectsRes.json();
      
      // WHAT: Fetch all Bitly links (including unassigned)
      const linksRes = await fetch('/api/bitly/links?includeUnassigned=true&limit=100');
      const linksData = await linksRes.json();

      if (projectsData.success && projectsData.projects) {
        setProjects(projectsData.projects);
      }

      if (linksData.success && linksData.links) {
        setLinks(linksData.links);
      }
    } catch (err) {
      setError('Failed to load data. Please refresh the page.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
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
        setSuccessMessage(`✓ ${data.message}`);
        setNewBitlink('');
        setCustomTitle('');
        setShowAddForm(false);
        loadData(); // Reload to show new link
      } else {
        setError(data.error || 'Failed to add link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Add link error:', err);
    }
  }

  // WHAT: Handle reassigning a link to a different project
  // WHY: Enables moving links between events as needed
  async function handleReassignLink(linkId: string, newProjectId: string | null) {
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/bitly/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('✓ Link reassigned successfully');
        loadData(); // Reload to show updated assignment
      } else {
        setError(data.error || 'Failed to reassign link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Reassign error:', err);
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
        loadData(); // Reload to remove archived link from list
      } else {
        setError(data.error || 'Failed to archive link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Archive error:', err);
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
        loadData(); // Reload to show updated analytics
      } else {
        setError(data.message || 'Sync failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Sync error:', err);
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

  return (
    <div className="admin-container">
      {/* WHAT: Page header with title and actions */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">🔗 Bitly Management</h1>
          <p className="page-subtitle">
            Manage Bitly link associations and track analytics for MessMass projects
          </p>
        </div>
        <div className="page-header-actions">
          <button 
            onClick={handleManualSync} 
            className="btn btn-success"
          >
            🔄 Sync Now
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary"
          >
            {showAddForm ? '✕ Cancel' : '+ Add Link'}
          </button>
        </div>
      </div>

      {/* WHAT: Status messages */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          {successMessage}
        </div>
      )}

      {/* WHAT: Add link form */}
      {showAddForm && (
        <div className="glass-card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="section-title">Add Bitly Link</h2>
          <form onSubmit={handleAddLink}>
            <div className="form-group">
              <label className="form-label">Bitly Link or URL *</label>
              <input
                type="text"
                className="form-input"
                value={newBitlink}
                onChange={(e) => setNewBitlink(e.target.value)}
                placeholder="bit.ly/abc123 or https://example.com/page"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Project (optional)</label>
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
            </div>

            <div className="form-group">
              <label className="form-label">Custom Title (optional)</label>
              <input
                type="text"
                className="form-input"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Leave empty to use Bitly's title"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Add Link
            </button>
          </form>
        </div>
      )}

      {/* WHAT: Links table */}
      <div className="glass-card">
        <div className="section-header">
          <h2 className="section-title">Links ({links.length})</h2>
        </div>
        
        {links.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <h3 className="empty-state-title">No Bitly links yet</h3>
            <p className="empty-state-text">
              Click "Add Link" above to connect your first Bitly URL to a MessMass project
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bitly Link</th>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Clicks</th>
                  <th>Last Synced</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link._id}>
                    <td>
                      <a 
                        href={`https://${link.bitlink}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link link-primary"
                        style={{ fontWeight: 500 }}
                      >
                        {link.bitlink}
                      </a>
                    </td>
                    <td>{link.title}</td>
                    <td>
                      <select
                        value={link.projectId || ''}
                        onChange={(e) => handleReassignLink(link._id, e.target.value || null)}
                        className="form-input"
                        style={{ minWidth: '200px' }}
                      >
                        <option value="">-- Unassigned --</option>
                        {projects.map(project => (
                          <option key={project._id} value={project._id}>
                            {project.eventName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 600 }}>
                        {link.click_summary.total.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)' }}>
                      {formatDate(link.lastSyncAt)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleArchiveLink(link._id)}
                        className="btn btn-small btn-danger"
                        title="Archive this link"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WHAT: Info section */}
      <div className="info-box" style={{ marginTop: 'var(--space-6)' }}>
        <p style={{ margin: '0.5rem 0' }}>
          <strong style={{ color: 'var(--color-primary-600)' }}>Auto-Sync:</strong> Links sync automatically every night at 3:00 AM UTC
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          <strong style={{ color: 'var(--color-primary-600)' }}>Manual Sync:</strong> Click "Sync Now" to refresh analytics immediately
        </p>
      </div>
    </div>
  );
}
