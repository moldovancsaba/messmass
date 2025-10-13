'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHashtagData } from '@/contexts/HashtagDataProvider';
import ColoredCard from '@/components/ColoredCard';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import styles from './HashtagEditor.module.css';

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
    <div className={`${styles.hashtagEditor} ${className}`}>

      {/* Form */}
      {showForm && (
        <div className={styles.hashtagFormContainer}>
          <form onSubmit={handleSubmit} className={styles.hashtagForm}>
            <h4>Edit Hashtag Color</h4>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hashtag Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. hungary, soccer, mlsz"
                  disabled={isSubmitting}
                  autoFocus
                />
                <small className={styles.formHint}>Enter without # symbol</small>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Bubble Color</label>
                <div className={styles.colorPickerContainer}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={() => setFormData(prev => ({ ...prev, color: generateRandomColor() }))}
                    disabled={isSubmitting}
                  >
                    🎲 Random
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            {/* WHAT: Use ColoredHashtagBubble component for preview consistency
             * WHY: All hashtag bubbles should use the same centralized component */}
            <div className={styles.hashtagPreview}>
              <label className={styles.formLabel}>Preview:</label>
              <ColoredHashtagBubble 
                hashtag={formData.name || 'example'}
                categoryColor={formData.color}
              />
            </div>

            <div className={styles.formActions}>
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

      {/* WHAT: Pagination stats header showing X of Y items
       * WHY: Consistent format across all admin pages (Categories, Users, Projects, Filter) */}
      {!loading && projectHashtags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Showing {projectHashtags.length} of {totalMatched} hashtags
          </div>
        </div>
      )}

      {/* Project Hashtags List */}
      <div className={styles.hashtagsList}>
        
        {loading ? (
          <div className={styles.loading}>Loading hashtags...</div>
        ) : projectHashtags.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏷️</div>
            <div className={styles.emptyTitle}>No Hashtags Found</div>
            <div className={styles.emptySubtitle}>Create projects with hashtags to manage their colors here</div>
          </div>
        ) : (
          <>
            {/* WHAT: Hashtags grid using centralized ColoredCard component
             * WHY: Same implementation as dashboard and categories - single source of truth
             *      ColoredCard handles all card styling (border, padding, shadow, hover) */}
            <div className={styles.hashtagsGrid}>
              {projectHashtags.map((projectHashtag) => {
                const colorRecord = hashtagColors.find(hc => hc.name.toLowerCase() === projectHashtag.hashtag.toLowerCase());
                const displayColor = colorRecord?.color || '#667eea';
                const hasCustomColor = !!colorRecord;
                
                return (
                  <ColoredCard key={projectHashtag.hashtag} accentColor={displayColor} className={styles.hashtagCardContent}>
                    <div style={{ display: 'flex', gap: 'var(--mm-space-4)', justifyContent: 'space-between' }}>
                      {/* Left side: Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* WHAT: Hashtag display with usage count using ColoredHashtagBubble component
                         * WHY: Centralized component ensures consistent styling across all admin pages */}
                        <div className={styles.hashtagCardHeader}>
                          <ColoredHashtagBubble 
                            hashtag={projectHashtag.hashtag}
                            categoryColor={displayColor}
                          />
                        </div>
                        
                        <div className={styles.hashtagCardDetails}>
                          <div className={styles.hashtagStats}>
                            <small>Used in {projectHashtag.count} project{projectHashtag.count !== 1 ? 's' : ''}</small>
                          </div>
                        </div>
                      </div>

                          {/* Right side: Action buttons stacked vertically */}
                          {/* WHAT: Using centralized .btn classes from components.css
                           * WHY: NO custom button styles - must use global design system */}
                          <div className={styles.hashtagCardActions}>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleEdit(projectHashtag.hashtag)}
                              style={{ minWidth: '80px' }}
                            >
                              ✏️ Edit
                            </button>
                            {hasCustomColor && (
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => handleDelete(projectHashtag.hashtag)}
                                style={{ minWidth: '80px' }}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                    </div>
                  </ColoredCard>
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
    </div>
  );
}
