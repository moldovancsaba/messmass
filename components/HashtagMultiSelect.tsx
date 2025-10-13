'use client';

import React, { useState, useEffect } from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import styles from './HashtagMultiSelect.module.css';

interface HashtagItem {
  hashtag: string;
  slug: string;
  count: number;
}

/**
 * HashtagMultiSelect Component
 * 
 * What: Pure hashtag selection UI component without action buttons.
 * Why: Apply Filter action moved to admin filter page actions row to centralize
 *      all filter controls (Apply, Share, Export) in one location for better UX.
 *      This component now focuses solely on hashtag selection and preview.
 */
interface HashtagMultiSelectProps {
  hashtags: HashtagItem[];
  selectedHashtags: string[];
  onSelectionChange: (selected: string[]) => void;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

interface MatchPreview {
  count: number;
}

export default function HashtagMultiSelect({
  hashtags,
  selectedHashtags,
  onSelectionChange,
  disabled = false,
  showPreview = true,
  className = ''
}: HashtagMultiSelectProps) {
  const [matchPreview, setMatchPreview] = useState<MatchPreview>({ count: 0 });

  // Function to preview match count for selected hashtags
  const previewMatches = async (tags: string[]) => {
    if (tags.length === 0) {
      setMatchPreview({ count: 0 });
      return;
    }
    
    try {
      const tagsParam = tags.join(',');
      const response = await fetch(`/api/hashtags/filter?tags=${encodeURIComponent(tagsParam)}`);
      const data = await response.json();
      
      if (data.success) {
        setMatchPreview({ count: data.filter.matchCount });
      } else {
        setMatchPreview({ count: 0 });
      }
    } catch (error) {
      console.error('Failed to preview matches:', error);
      setMatchPreview({ count: 0 });
    }
  };

  // Preview matches when selection changes (debounced)
  useEffect(() => {
    if (showPreview) {
      const timeoutId = setTimeout(() => {
        previewMatches(selectedHashtags);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedHashtags, showPreview]);

  // Handle individual hashtag toggle
  const handleHashtagToggle = (hashtag: string) => {
    if (disabled) return;
    
    const newSelection = selectedHashtags.includes(hashtag)
      ? selectedHashtags.filter(tag => tag !== hashtag)
      : [...selectedHashtags, hashtag];
    
    onSelectionChange(newSelection);
  };

  // Handle clear all
  const handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // Handle select all (limit to reasonable amount)
  const handleSelectAll = () => {
    if (disabled) return;
    const allHashtags = hashtags.slice(0, 10).map(item => item.hashtag); // Limit to first 10
    onSelectionChange(allHashtags);
  };

  // Sort hashtags by usage count (descending) then alphabetically
  const sortedHashtags = [...hashtags].sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return a.hashtag.localeCompare(b.hashtag);
  });

  return (
    <div className={`hashtag-multi-select ${className}`}>
      {/* Preview Results - Only show if we have selections */}
      {showPreview && selectedHashtags.length > 0 && (
        <div className={styles.previewContainer}>
          <div className={`${styles.previewBox} ${matchPreview.count > 0 ? styles.success : styles.error}`}>
            📊 {matchPreview.count} project{matchPreview.count !== 1 ? 's' : ''} match{matchPreview.count === 1 ? 'es' : ''} your filter
          </div>
        </div>
      )}

      {/* Selected Hashtags Display */}
      {selectedHashtags.length > 0 && (
        <div className={styles.selectedContainer}>
          <div className={styles.selectedTitle}>
            Selected Filters ({selectedHashtags.length}):
          </div>
          <div className={styles.selectedTags}>
            {selectedHashtags.map((hashtag, index) => (
              <div key={hashtag} className={styles.selectedTag}>
                {index > 0 && (
                  <span className={styles.andSeparator}>
                    AND
                  </span>
                )}
                <ColoredHashtagBubble 
                  hashtag={hashtag}
                  customStyle={{
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                  removable={!disabled}
                  onRemove={() => handleHashtagToggle(hashtag)}
                  interactive={true}
                  onClick={() => handleHashtagToggle(hashtag)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hashtag Selection Grid */}
      <div className={styles.selectionSection}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>
            Available Hashtags ({hashtags.length})
          </h4>
          <div className={styles.actionButtons}>
            <button
              onClick={handleSelectAll}
              disabled={disabled || hashtags.length === 0}
              className="btn btn-small btn-secondary"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              disabled={disabled || selectedHashtags.length === 0}
              className="btn btn-small btn-danger"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Hashtags Grid */}
        {(() => {
          // Group hashtags by category vs traditional
          const traditionalHashtags = sortedHashtags.filter(item => !item.hashtag.includes(':'));
          const categorizedHashtags = sortedHashtags.filter(item => item.hashtag.includes(':'));
          
          // Group categorized hashtags by category
          const categorizedByCategory = categorizedHashtags.reduce((acc, item) => {
            const [category] = item.hashtag.split(':');
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
          }, {} as Record<string, typeof sortedHashtags>);
          
          return (
            <div>
              {/* Traditional Hashtags */}
              {traditionalHashtags.length > 0 && (
                <div className={styles.categorySection}>
                  <h5 className={styles.categoryTitle}>
                    🏷️ General Hashtags ({traditionalHashtags.length})
                  </h5>
                  <div className={styles.hashtagsGrid}>
                    {traditionalHashtags.map((item) => (
                      <label
                        key={item.hashtag}
                        className={`${styles.hashtagItem} ${selectedHashtags.includes(item.hashtag) ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHashtags.includes(item.hashtag)}
                          onChange={() => handleHashtagToggle(item.hashtag)}
                          disabled={disabled}
                          className={styles.checkbox}
                        />
                        <div className={styles.hashtagContent}>
                          <ColoredHashtagBubble 
                            hashtag={item.hashtag}
                            customStyle={{
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          />
                          <span className={styles.countBadge}>
                            {item.count}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Categorized Hashtags */}
              {Object.entries(categorizedByCategory).map(([category, categoryHashtags]) => (
                <div key={category} className={styles.categorySection}>
                  <h5 className={styles.categoryTitle}>
                    📂 {category.charAt(0).toUpperCase() + category.slice(1)} Category ({categoryHashtags.length})
                  </h5>
                  <div className={styles.hashtagsGrid}>
                    {categoryHashtags.map((item) => (
                      <label
                        key={item.hashtag}
                        className={`${styles.hashtagItem} ${selectedHashtags.includes(item.hashtag) ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHashtags.includes(item.hashtag)}
                          onChange={() => handleHashtagToggle(item.hashtag)}
                          disabled={disabled}
                          className={styles.checkbox}
                        />
                        <div className={styles.hashtagContent}>
                          <ColoredHashtagBubble 
                            hashtag={item.hashtag}
                            customStyle={{
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          />
                          <span className={styles.countBadge}>
                            {item.count}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* No hashtags available message */}
      {hashtags.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏷️</div>
          <div className={styles.emptyTitle}>
            No hashtags available
          </div>
          <div className={styles.emptySubtitle}>
            Create projects with hashtags to enable filtering
          </div>
        </div>
      )}
    </div>
  );
}
