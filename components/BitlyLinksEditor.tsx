// components/BitlyLinksEditor.tsx
// WHAT: Inline Bitly link management component for event editor
// WHY: Allows adding/viewing Bitly links directly from event edit page
// USAGE: Embedded in EditorDashboard before hashtag section

'use client';

import { useState, useEffect } from 'react';
import styles from './BitlyLinksEditor.module.css';

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

  // WHAT: Load links for this project on mount
  useEffect(() => {
    loadLinks();
  }, [projectId]);

  // WHAT: Fetch all Bitly links associated with this project
  async function loadLinks() {
    try {
      setLoading(true);
      const res = await fetch(`/api/bitly/links?projectId=${projectId}`);
      const data = await res.json();
      
      if (data.success) {
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Failed to load Bitly links:', err);
    } finally {
      setLoading(false);
    }
  }

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
      const res = await fetch('/api/bitly/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          bitlinkOrLongUrl: newBitlink.trim(),
        }),
      });

      const data = await res.json();

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

  // WHAT: Handle removing a link from this project
  async function handleRemoveLink(linkId: string) {
    if (!confirm('Remove this link? Data will be preserved but link will be unassigned.')) {
      return;
    }

    try {
      // WHAT: Unassign the link (set projectId to null)
      const res = await fetch(`/api/bitly/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: null }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('✓ Link removed');
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
          No Bitly links yet. Click "+ Add Link" to connect one!
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
                onClick={() => handleRemoveLink(link._id)}
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
