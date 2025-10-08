'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHashtagData } from '@/contexts/HashtagDataProvider';

interface HashtagColor {
  _id: string;
  uuid: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// WHAT: Minimal item model for Project Hashtags list.
// WHY: UI actions operate on hashtag names; slugs are not needed for color edit/delete.
interface ProjectHashtag {
  hashtag: string;
  count: number;
}

interface HashtagEditorProps {
  className?: string;
  // WHAT: External search term (from HERO) to drive server-side pagination & filtering.
  // WHY: Centralizes filtering behavior and reuses existing /api/hashtags logic.
  searchTerm?: string;
}

export default function HashtagEditor({ className = '', searchTerm = '' }: HashtagEditorProps) {
  // Use context for hashtag colors instead of local state
  const { hashtagColors, loadingColors, refreshColors } = useHashtagData();
  
  // Server-driven, paginated items
  const [projectHashtags, setProjectHashtags] = useState<ProjectHashtag[]>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  // UI state for the edit form
  const [showForm, setShowForm] = useState(false);
  const [editingHashtag, setEditingHashtag] = useState<{ name: string; color: string; hasColorRecord: boolean } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#667eea'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce & cancellation for in-flight search requests
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    // WHAT: Load first page whenever the debounced search changes.
    // WHY: Keeps UX responsive and consistent with existing /api/hashtags pagination.
    const loadFirst = async () => {
      setLoading(true);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const qs = debouncedTerm
          ? `?search=${encodeURIComponent(debouncedTerm)}&offset=0&limit=${PAGE_SIZE}`
          : `?offset=0&limit=${PAGE_SIZE}`;
        const res = await fetch(`/api/hashtags${qs}`, { cache: 'no-store', signal: ctrl.signal });
        const data = await res.json();
        if (data.success) {
          const items: ProjectHashtag[] = Array.isArray(data.hashtags)
            ? data.hashtags.map((h: any) => ({ hashtag: typeof h === 'string' ? h : h?.hashtag, count: (typeof h === 'string' ? 0 : h?.count) ?? 0 }))
                .filter((x: any) => !!x.hashtag)
            : [];
          setProjectHashtags(items);
          setNextOffset(data.pagination?.nextOffset ?? null);
          setTotalMatched(data.pagination?.totalMatched ?? items.length);
        }
      } catch (err) {
        // Swallow abort errors silently; log others
        if ((err as any)?.name !== 'AbortError') {
          console.error('Failed to load project hashtags:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  const loadMore = async () => {
    if (loadingMore || nextOffset == null) return;
    setLoadingMore(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const qs = debouncedTerm
        ? `?search=${encodeURIComponent(debouncedTerm)}&offset=${nextOffset}&limit=${PAGE_SIZE}`
        : `?offset=${nextOffset}&limit=${PAGE_SIZE}`;
      const res = await fetch(`/api/hashtags${qs}`, { cache: 'no-store', signal: ctrl.signal });
      const data = await res.json();
      if (data.success) {
        const items: ProjectHashtag[] = Array.isArray(data.hashtags)
          ? data.hashtags.map((h: any) => ({ hashtag: typeof h === 'string' ? h : h?.hashtag, count: (typeof h === 'string' ? 0 : h?.count) ?? 0 }))
              .filter((x: any) => !!x.hashtag)
          : [];
        setProjectHashtags(prev => [...prev, ...items]);
        setNextOffset(data.pagination?.nextOffset ?? null);
        setTotalMatched(data.pagination?.totalMatched ?? totalMatched);
      }
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Failed to load more project hashtags:', err);
      }
    } finally {
      setLoadingMore(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a hashtag name');
      return;
    }

    if (!editingHashtag) {
      alert('Error: No hashtag selected for editing');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const method = editingHashtag.hasColorRecord ? 'PUT' : 'POST';
      const body = editingHashtag.hasColorRecord 
        ? { name: editingHashtag.name, color: formData.color } // Update existing record by name
        : { name: formData.name, color: formData.color }; // Create new record

      const response = await fetch('/api/hashtag-colors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        // Refresh hashtag colors via context
        await refreshColors();
        resetForm();
        alert('Hashtag updated successfully!');
      } else {
        alert(data.error || 'Failed to update hashtag');
      }
    } catch (error) {
      console.error('Failed to submit hashtag:', error);
      alert('Failed to update hashtag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (hashtagName: string) => {
    const colorRecord = hashtagColors.find(hc => hc.name.toLowerCase() === hashtagName.toLowerCase());
    
    setEditingHashtag({
      name: hashtagName,
      color: colorRecord?.color || '#667eea',
      hasColorRecord: !!colorRecord
    });
    
    setFormData({
      name: hashtagName,
      color: colorRecord?.color || '#667eea'
    });
    
    setShowForm(true);
  };

  const handleDelete = async (hashtagName: string) => {
    const colorRecord = hashtagColors.find(hc => hc.name.toLowerCase() === hashtagName.toLowerCase());
    
    if (!colorRecord) {
      alert('This hashtag has no color configuration to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the color configuration for hashtag "${hashtagName}"? The hashtag will revert to default color.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/hashtag-colors?id=${colorRecord._id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Refresh hashtag colors via context
        await refreshColors();
        alert('Hashtag color configuration deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete hashtag color');
      }
    } catch (error) {
      console.error('Failed to delete hashtag color:', error);
      alert('Failed to delete hashtag color. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', color: '#667eea' });
    setEditingHashtag(null);
    setShowForm(false);
  };

  const generateRandomColor = () => {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
      '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
      '#d299c2', '#fef9d7', '#ebc0fd', '#d9a7c7', '#96c93d', '#00b4db'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return (
      <div className={`hashtag-editor ${className}`}>
        <div className="loading">Loading hashtags...</div>
      </div>
    );
  }

  return (
    <div className={`hashtag-editor ${className}`}>

      {/* Form */}
      {showForm && (
        <div className="hashtag-form-container">
          <form onSubmit={handleSubmit} className="hashtag-form">
            <h4>Edit Hashtag Color</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hashtag Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. hungary, soccer, mlsz"
                  disabled={isSubmitting}
                  autoFocus
                />
                <small className="form-hint">Enter without # symbol</small>
              </div>
              
              <div className="form-group">
                <label className="form-label">Bubble Color</label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    className="color-input"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setFormData(prev => ({ ...prev, color: generateRandomColor() }))}
                    disabled={isSubmitting}
                  >
                    🎲 Random
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="hashtag-preview">
              <label className="form-label">Preview:</label>
              <span 
                className="hashtag-bubble preview"
                style={{ backgroundColor: formData.color }}
              >
                #{formData.name || 'example'}
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting 
                  ? (editingHashtag ? 'Updating...' : 'Creating...') 
                  : (editingHashtag ? 'Update Hashtag' : 'Create Hashtag')
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Hashtags List */}
      <div className="hashtags-list">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h4 style={{ margin: 0 }}>Project Hashtags ({totalMatched})</h4>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Showing {projectHashtags.length} of {totalMatched}
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading hashtags...</div>
        ) : projectHashtags.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <div className="empty-title">No Hashtags Found</div>
            <div className="empty-subtitle">Create projects with hashtags to manage their colors here</div>
          </div>
        ) : (
          <>
            <div className="hashtags-grid">
              {projectHashtags.map((projectHashtag) => {
                const colorRecord = hashtagColors.find(hc => hc.name.toLowerCase() === projectHashtag.hashtag.toLowerCase());
                const displayColor = colorRecord?.color || '#667eea';
                const hasCustomColor = !!colorRecord;
                
                return (
                  <div key={projectHashtag.hashtag} className="hashtag-card" style={{ borderLeftColor: displayColor }}>
                    <div className="hashtag-card-header">
                      <span 
                        className="hashtag-bubble"
                        style={{ backgroundColor: displayColor }}
                      >
                        #{projectHashtag.hashtag}
                      </span>
                      {!hasCustomColor && (
                        <span className="default-badge">Default Color</span>
                      )}
                    </div>
                    
                    <div className="hashtag-card-details">
                      <div className="hashtag-stats">
                        <small>Used in {projectHashtag.count} project{projectHashtag.count !== 1 ? 's' : ''}</small>
                      </div>
                    </div>
                    
                    <div className="hashtag-card-actions">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleEdit(projectHashtag.hashtag)}
                      >
                        ✏️ Edit Hashtag
                      </button>
                      {hasCustomColor && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(projectHashtag.hashtag)}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {nextOffset != null ? (
                <button className="btn btn-secondary" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more`}
                </button>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .hashtag-editor {
          margin-bottom: 2rem;
        }

        .hashtag-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .hashtag-editor-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .hashtag-form-container {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .hashtag-form h4 {
          margin: 0 0 1.5rem 0;
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          color: #374151;
          font-weight: 500;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-hint {
          color: #6b7280;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .color-picker-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .color-input {
          width: 60px;
          height: 38px;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          padding: 0;
        }

        .hashtag-preview {
          margin-bottom: 1.5rem;
        }

        .hashtag-bubble {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hashtag-bubble.preview {
          font-size: 1rem;
          padding: 0.75rem 1.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .hashtags-list h4 {
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .empty-subtitle {
          font-size: 0.875rem;
        }

        .hashtags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .hashtag-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid rgba(102, 126, 234, 0.1);
          border-left: 4px solid; /* WHAT: Colored left border using hashtag color, WHY: Visual hierarchy like dashboard cards */
          transition: all 0.2s ease;
        }

        .hashtag-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .hashtag-card-header {
          margin-bottom: 1rem;
        }

        .hashtag-card-details {
          margin-bottom: 1rem;
        }

        .hashtag-stats small {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .hashtag-dates {
          color: #6b7280;
          font-size: 0.75rem;
        }

        .hashtag-card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.875rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5a67d8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-info {
          background: #06b6d4;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background: #0891b2;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
