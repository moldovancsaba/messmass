// components/BitlyLinksEditor.tsx
// WHAT: Inline Bitly link management component for event editor
// WHY: Allows adding/viewing Bitly links directly from event edit page
// USAGE: Embedded in EditorDashboard before hashtag section

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './BitlyLinksEditor.module.css';
import { apiPost, apiDelete } from '@/lib/apiClient';

interface BitlyLinksEditorProps {
  projectId: string;
  projectName: string;
}

interface BitlyLink {
  _id: string;
  bitlink: string;
  title: string;
  click_summary: {
    total: number;
  };
  lastSyncAt: string;
}

export default function BitlyLinksEditor({ projectId, projectName }: BitlyLinksEditorProps) {
  // WHAT: Component state
  const [links, setLinks] = useState<BitlyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBitlink, setNewBitlink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // WHAT: Fetch all Bitly links associated with this project via junction table
  // WHY: Many-to-many system - links can be shared across multiple projects
  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      // WHAT: Use project-specific metrics API to get associated links
      // WHY: This API joins junction table data with link details
      const res = await fetch(`/api/bitly/project-metrics/${projectId}`);
      const data = await res.json();
      
      console.log('[BitlyLinksEditor] API response:', data);
      
      if (data.links && Array.isArray(data.links)) {
        // WHAT: Extract link data from API response
        // WHY: Transform project metrics format to match BitlyLink interface
        const linkData = data.links.map((link: any) => ({
          _id: link.bitlyLinkId,
          bitlink: link.bitlink,
          title: link.title || 'Untitled',
          click_summary: {
            total: link.metrics?.clicks || 0
          },
          lastSyncAt: link.lastSyncedAt || new Date().toISOString()
        }));
        console.log('[BitlyLinksEditor] Transformed links:', linkData);
        setLinks(linkData);
      } else {
        console.log('[BitlyLinksEditor] No links found in response');
        setLinks([]);
      }
    } catch (err) {
      console.error('Failed to load Bitly links:', err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // WHAT: Load links for this project on mount
  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // WHAT: Handle adding a new Bitly link to this project
  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newBitlink.trim()) {
      setError('Please enter a Bitly link');
      return;
    }

    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPost('/api/bitly/links', {
        projectId,
        bitlinkOrLongUrl: newBitlink.trim(),
      });

      if (data.success) {
        setSuccess('✓ Link added!');
        setNewBitlink('');
        setShowAddForm(false);
        loadLinks(); // Reload to show new link
      } else {
        setError(data.error || 'Failed to add link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Add link error:', err);
    }
  }

  // WHAT: Handle removing a link-to-project association (many-to-many)
  // WHY: Delete from junction table instead of unassigning (preserves other project associations)
  async function handleRemoveLink(linkId: string, bitlink: string) {
    if (!confirm(`Remove ${bitlink} from ${projectName}? The link will remain available for other projects.`)) {
      return;
    }

    try {
      // WHAT: Delete association from junction table using apiDelete() with CSRF token
      // WHY: Many-to-many system - only removes this specific project connection
      const data = await apiDelete(`/api/bitly/associations?bitlyLinkId=${linkId}&projectId=${projectId}`);

      if (data.success) {
        setSuccess('✓ Link removed from this project');
        loadLinks(); // Reload to remove from list
      } else {
        setError(data.error || 'Failed to remove link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Remove link error:', err);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          🔗 Bitly Links
          {links.length > 0 && <span className={styles.count}>({links.length})</span>}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addButton}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Link'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {showAddForm && (
        <form onSubmit={handleAddLink} className={styles.addForm}>
          <input
            type="text"
            value={newBitlink}
            onChange={(e) => setNewBitlink(e.target.value)}
            placeholder="Paste Bitly link (e.g., bit.ly/abc123)"
            className={styles.input}
            required
          />
          <button type="submit" className={styles.submitButton}>
            Add
          </button>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Loading links...</div>
      ) : links.length === 0 ? (
        <div className={styles.empty}>
          No Bitly links yet. Click &quot;+ Add Link&quot; to connect one!
        </div>
      ) : (
        <div className={styles.linksList}>
          {links.map(link => (
            <div key={link._id} className={styles.linkCard}>
              <div className={styles.linkInfo}>
                <a
                  href={`https://${link.bitlink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkUrl}
                >
                  {link.bitlink}
                </a>
                <div className={styles.linkMeta}>
                  <span className={styles.clicks}>
                    {link.click_summary.total.toLocaleString()} clicks
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.title}>{link.title}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemoveLink(link._id, link.bitlink)}
                className={styles.removeButton}
                title="Remove from this event"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
