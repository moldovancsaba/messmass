// components/DriveFoldersEditor.tsx
// WHAT: Inline Google Drive folder link management for the event editor.
// WHY: Self-service way for an admin to link one or more Drive folders to an
//      event; fanmass later reads these via a separate integration endpoint
//      and reports back per-folder verification status. messmass never talks
//      to Google Drive itself.
// USAGE: Embedded in the edit-project FormModal, app/admin/events/page.tsx,
//        immediately after BitlyLinksEditor.

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './DriveFoldersEditor.module.css';
import { apiPost, apiDelete } from '@/lib/apiClient';
import { extractDriveFolderId } from '@/lib/googleDriveFolder';

interface DriveFoldersEditorProps {
  projectId: string;
  projectName: string;
}

interface DriveFolderLink {
  _id: string;
  folderId: string;
  folderUrl: string;
  label?: string;
  status: 'pending' | 'verified' | 'error';
  lastError?: string;
}

const STATUS_LABEL: Record<DriveFolderLink['status'], string> = {
  pending: '⏳ Pending',
  verified: '✓ Verified',
  error: '⚠ Error',
};

export default function DriveFoldersEditor({ projectId, projectName }: DriveFoldersEditorProps) {
  const [links, setLinks] = useState<DriveFolderLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFolderUrl, setNewFolderUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/drive-folders?projectId=${projectId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setLinks(data.links);
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error('Failed to load Drive folder links:', err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Instant client-side feedback while typing — the server re-validates
  // independently and is the actual source of truth.
  const previewFolderId = newFolderUrl.trim() ? extractDriveFolderId(newFolderUrl) : null;
  const showInvalidHint = newFolderUrl.trim().length > 0 && !previewFolderId;

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newFolderUrl.trim()) {
      setError('Please paste a Google Drive folder link');
      return;
    }

    try {
      const data = await apiPost('/api/drive-folders', {
        projectId,
        folderUrl: newFolderUrl.trim(),
      });

      if (data.success) {
        setSuccess('✓ Drive folder linked!');
        setNewFolderUrl('');
        setShowAddForm(false);
        loadLinks();
      } else {
        setError(data.error || 'Failed to add Drive folder');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      console.error('Add Drive folder error:', err);
    }
  }

  async function handleRemoveLink(linkId: string, folderUrl: string) {
    if (!confirm(`Remove ${folderUrl} from ${projectName}?`)) {
      return;
    }

    try {
      const data = await apiDelete(`/api/drive-folders/${linkId}?projectId=${projectId}`);

      if (data.success) {
        setSuccess('✓ Drive folder removed');
        loadLinks();
      } else {
        setError(data.error || 'Failed to remove Drive folder');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      console.error('Remove Drive folder error:', err);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          📁 Drive Folders
          {links.length > 0 && <span className={styles.count}>({links.length})</span>}
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addButton}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Folder'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {showAddForm && (
        <form onSubmit={handleAddLink} className={styles.addForm}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={newFolderUrl}
              onChange={(e) => setNewFolderUrl(e.target.value)}
              placeholder="Paste a Google Drive folder link"
              className={styles.input}
              required
            />
            {showInvalidHint && (
              <p className={styles.inputHint}>
                Couldn&apos;t find a folder ID in that link yet — paste the full Drive folder URL.
              </p>
            )}
          </div>
          <button type="submit" className={styles.submitButton} disabled={!previewFolderId}>
            Add
          </button>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Loading Drive folders...</div>
      ) : links.length === 0 ? (
        <div className={styles.empty}>
          No Drive folders linked yet. Click &quot;+ Add Folder&quot; to connect one!
        </div>
      ) : (
        <div className={styles.linksList}>
          {links.map((link) => (
            <div key={link._id} className={styles.linkCard}>
              <div className={styles.linkInfo}>
                <a
                  href={link.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkUrl}
                >
                  {link.label || link.folderUrl}
                </a>
                <div className={styles.linkMeta}>
                  <span className={`${styles.statusBadge} ${styles[`status_${link.status}`]}`}>
                    {STATUS_LABEL[link.status]}
                  </span>
                  {link.status === 'error' && link.lastError && (
                    <>
                      <span className={styles.separator}>•</span>
                      <span className={styles.errorDetail}>{link.lastError}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveLink(link._id, link.folderUrl)}
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
