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
import { apiPost, apiDelete, apiPatch } from '@/lib/apiClient';
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
  status: 'pending' | 'analyzing' | 'complete' | 'empty' | 'error' | 'verified';
  lastError?: string;
  imagesDiscovered?: number;
  imagesAnalyzed?: number;
  paused?: boolean;
  syncRequestedAt?: string;
}

// WHAT: What each state means to the person reading it.
// WHY: The badge used to say "Verified" as soon as fanmass had *read* the folder,
//      which an operator reasonably takes to mean the data is ready. It was not:
//      an event showed two verified folders while 411 photos were unanalysed and
//      its variables were empty. The wording now answers "is this ready?".
const STATUS_LABEL: Record<DriveFolderLink['status'], string> = {
  pending: 'Waiting to be read',
  analyzing: 'Analysing',
  // "Images complete", not "Analysis complete" — this only means every
  // discovered image had its base pass run. Deeper modules (e.g.
  // demographics) can cover a smaller slice; see the per-event AI report.
  complete: 'Images complete',
  empty: 'No images found',
  error: 'Failed',
  // Legacy: written by a fanmass build predating the analysis-aware vocabulary.
  verified: 'Read, analysis unknown',
};

// WHAT: Percent analysed for a folder, or null when it cannot be known.
// WHY: Shown as text alongside the state so progress never depends on colour or
//      an animation to be understood.
function progressPercent(link: DriveFolderLink): number | null {
  const discovered = link.imagesDiscovered ?? 0;
  const analyzed = link.imagesAnalyzed ?? 0;
  if (discovered <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((analyzed / discovered) * 100)));
}

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

  async function handleAddLink() {
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

  // Shared by Check now / Pause / Resume — same request shape, same
  // optimistic reload, only the action and success copy differ.
  async function handleAction(linkId: string, action: 'pause' | 'resume' | 'sync', successMessage: string) {
    setError('');
    setSuccess('');
    try {
      const data = await apiPatch(`/api/drive-folders/${linkId}?projectId=${projectId}`, { action });
      if (data.success) {
        setSuccess(successMessage);
        loadLinks();
      } else {
        setError(data.error || `Failed to ${action} this folder`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      console.error(`Drive folder ${action} error:`, err);
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

      {/* A plain div, not a <form> — this editor is embedded inside FormModal's
          own <form>, and a nested form is invalid HTML whose submit can bubble
          to the outer modal's submit handler. type="button" + onClick keeps
          this action fully independent of the surrounding form. */}
      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={newFolderUrl}
              onChange={(e) => setNewFolderUrl(e.target.value)}
              onKeyDown={(e) => {
                // This input still lives inside FormModal's own outer <form>
                // (only the add-panel wrapper stopped being one). preventDefault
                // unconditionally on Enter so an invalid-but-non-empty value —
                // which still satisfies the native `required` constraint — can
                // never fall through to the outer form's implicit submit.
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (previewFolderId) {
                  handleAddLink();
                }
              }}
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
          <button
            type="button"
            onClick={handleAddLink}
            className={styles.submitButton}
            disabled={!previewFolderId}
          >
            Add
          </button>
        </div>
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
                  {/* The label carries the meaning; the colour only reinforces it,
                      so the state is legible without colour vision and to a screen
                      reader reading the text content. */}
                  <span className={`${styles.statusBadge} ${styles[`status_${link.status}`] || ''}`}>
                    {STATUS_LABEL[link.status] || 'Unknown state'}
                  </span>
                  {link.paused && (
                    <>
                      <span className={styles.separator} aria-hidden="true">•</span>
                      <span className={styles.pausedBadge}>Paused — not checked by fanmass</span>
                    </>
                  )}
                  {!link.paused && link.syncRequestedAt && (
                    <>
                      <span className={styles.separator} aria-hidden="true">•</span>
                      <span className={styles.pendingBadge}>Check requested…</span>
                    </>
                  )}
                  {(() => {
                    const percent = progressPercent(link);
                    if (percent === null || link.status === 'error') return null;
                    const discovered = link.imagesDiscovered ?? 0;
                    const analyzed = link.imagesAnalyzed ?? 0;
                    return (
                      <>
                        <span className={styles.separator} aria-hidden="true">•</span>
                        <span
                          className={styles.progressDetail}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Analysis progress: ${percent} percent, ${analyzed} of ${discovered} images`}
                        >
                          {percent}% · {analyzed} of {discovered} images
                        </span>
                      </>
                    );
                  })()}
                  {link.status === 'error' && link.lastError && (
                    <>
                      <span className={styles.separator} aria-hidden="true">•</span>
                      <span className={styles.errorDetail}>{link.lastError}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.linkActions}>
                {!link.paused && (
                  <button
                    type="button"
                    onClick={() => handleAction(link._id, 'sync', '✓ Check requested — fanmass will look within moments')}
                    className={styles.actionButton}
                    disabled={Boolean(link.syncRequestedAt)}
                    title="Check for new images now, instead of waiting for the next scheduled poll"
                  >
                    {link.syncRequestedAt ? 'Check requested…' : 'Check now'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    link.paused
                      ? handleAction(link._id, 'resume', '✓ Resumed — fanmass will poll this folder again')
                      : handleAction(link._id, 'pause', '✓ Paused — fanmass will stop checking this folder')
                  }
                  className={styles.actionButton}
                  title={link.paused ? 'Resume fanmass polling for this folder' : 'Stop fanmass from checking this folder — use once it is done, or if it has no images'}
                >
                  {link.paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(link._id, link.folderUrl)}
                  className={styles.removeButton}
                  title="Remove from this event"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
