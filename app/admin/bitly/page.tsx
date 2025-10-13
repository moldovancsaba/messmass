// app/admin/bitly/page.tsx
// WHAT: Admin interface for managing Bitly link associations
// WHY: Provides visual UI for connecting Bitly URLs to MessMass projects
// USER WORKFLOW: Click to add links, view analytics, reassign between projects

'use client';

import { useState, useEffect } from 'react';
import styles from './bitly.module.css';

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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading Bitly links...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bitly Link Management</h1>
        <div className={styles.headerActions}>
          <button 
            onClick={handleManualSync} 
            className={styles.syncButton}
          >
            🔄 Sync Now
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={styles.addButton}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Link'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      {showAddForm && (
        <div className={styles.addForm}>
          <h2>Add Bitly Link</h2>
          <form onSubmit={handleAddLink}>
            <div className={styles.formGroup}>
              <label>Bitly Link or URL *</label>
              <input
                type="text"
                value={newBitlink}
                onChange={(e) => setNewBitlink(e.target.value)}
                placeholder="bit.ly/abc123 or https://example.com/page"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Assign to Project (optional)</label>
              <select
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

            <div className={styles.formGroup}>
              <label>Custom Title (optional)</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Leave empty to use Bitly's title"
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              Add Link
            </button>
          </form>
        </div>
      )}

      <div className={styles.linksTable}>
        <h2>Links ({links.length})</h2>
        
        {links.length === 0 ? (
          <p className={styles.emptyState}>
            No links yet. Click "Add Link" to get started!
          </p>
        ) : (
          <table>
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
                      className={styles.linkUrl}
                    >
                      {link.bitlink}
                    </a>
                  </td>
                  <td>{link.title}</td>
                  <td>
                    <select
                      value={link.projectId || ''}
                      onChange={(e) => handleReassignLink(link._id, e.target.value || null)}
                      className={styles.projectSelect}
                    >
                      <option value="">-- Unassigned --</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.eventName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.clickCount}>
                    {link.click_summary.total.toLocaleString()}
                  </td>
                  <td className={styles.timestamp}>
                    {formatDate(link.lastSyncAt)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleArchiveLink(link._id)}
                      className={styles.archiveButton}
                      title="Archive this link"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.info}>
        <p>
          <strong>Auto-Sync:</strong> Links sync automatically every night at 3:00 AM UTC
        </p>
        <p>
          <strong>Manual Sync:</strong> Click "Sync Now" to refresh analytics immediately
        </p>
      </div>
    </div>
  );
}
