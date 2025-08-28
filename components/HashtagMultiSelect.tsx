'use client';

import React, { useState, useEffect } from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';

interface HashtagItem {
  hashtag: string;
  slug: string;
  count: number;
}

interface HashtagMultiSelectProps {
  hashtags: HashtagItem[];
  selectedHashtags: string[];
  onSelectionChange: (selected: string[]) => void;
  onApplyFilter: () => void;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

interface MatchPreview {
  count: number;
  loading: boolean;
}

export default function HashtagMultiSelect({
  hashtags,
  selectedHashtags,
  onSelectionChange,
  onApplyFilter,
  disabled = false,
  showPreview = true,
  className = ''
}: HashtagMultiSelectProps) {
  const [matchPreview, setMatchPreview] = useState<MatchPreview>({ count: 0, loading: false });

  // Function to preview match count for selected hashtags
  const previewMatches = async (tags: string[]) => {
    if (tags.length === 0) {
      setMatchPreview({ count: 0, loading: false });
      return;
    }

    setMatchPreview({ count: 0, loading: true });
    
    try {
      const tagsParam = tags.join(',');
      const response = await fetch(`/api/hashtags/filter?tags=${encodeURIComponent(tagsParam)}`);
      const data = await response.json();
      
      if (data.success) {
        setMatchPreview({ count: data.filter.matchCount, loading: false });
      } else {
        setMatchPreview({ count: 0, loading: false });
      }
    } catch (error) {
      console.error('Failed to preview matches:', error);
      setMatchPreview({ count: 0, loading: false });
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
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 0.5rem 0'
        }}>
          🏷️ Multi-Hashtag Filter
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          margin: '0 0 0.5rem 0'
        }}>
          Select multiple hashtags to view aggregated statistics (AND logic - projects must have ALL selected tags)
        </p>
        
        {/* Preview Results */}
        {showPreview && selectedHashtags.length > 0 && (
          <div style={{
            padding: '0.75rem 1rem',
            background: matchPreview.loading 
              ? 'rgba(107, 114, 128, 0.1)' 
              : matchPreview.count > 0 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${
              matchPreview.loading 
                ? 'rgba(107, 114, 128, 0.2)' 
                : matchPreview.count > 0 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(239, 68, 68, 0.2)'
            }`,
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {matchPreview.loading ? (
              <>⏳ Checking matches...</>
            ) : (
              <>
                📊 {matchPreview.count} project{matchPreview.count !== 1 ? 's' : ''} match{matchPreview.count === 1 ? 'es' : ''} your filter
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected Hashtags Display */}
      {selectedHashtags.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.1)'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#4c51bf',
            marginBottom: '0.75rem'
          }}>
            Selected Filters ({selectedHashtags.length}):
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {selectedHashtags.map((hashtag, index) => (
              <div key={hashtag} style={{ display: 'flex', alignItems: 'center' }}>
                {index > 0 && (
                  <span style={{
                    margin: '0 0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    AND
                  </span>
                )}
                <ColoredHashtagBubble 
                  hashtag={hashtag}
                  customStyle={{
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hashtag Selection Grid */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            Available Hashtags ({hashtags.length})
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSelectAll}
              disabled={disabled || hashtags.length === 0}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                background: disabled ? '#e5e7eb' : '#f3f4f6',
                color: disabled ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              disabled={disabled || selectedHashtags.length === 0}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                background: disabled ? '#e5e7eb' : '#ef4444',
                color: disabled ? '#9ca3af' : 'white',
                border: '1px solid transparent',
                borderRadius: '6px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = '#dc2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = '#ef4444';
                }
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Hashtags Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.75rem'
        }}>
          {sortedHashtags.map((item) => (
            <label
              key={item.hashtag}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                background: selectedHashtags.includes(item.hashtag) 
                  ? 'rgba(99, 102, 241, 0.1)' 
                  : 'rgba(255, 255, 255, 0.9)',
                border: `2px solid ${
                  selectedHashtags.includes(item.hashtag) 
                    ? 'rgba(99, 102, 241, 0.3)' 
                    : 'rgba(229, 231, 235, 0.5)'
                }`,
                borderRadius: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectedHashtags.includes(item.hashtag)}
                onChange={() => handleHashtagToggle(item.hashtag)}
                disabled={disabled}
                style={{
                  marginRight: '0.75rem',
                  width: '1.25rem',
                  height: '1.25rem',
                  cursor: disabled ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ColoredHashtagBubble 
                  hashtag={item.hashtag}
                  customStyle={{
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                />
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  background: 'rgba(107, 114, 128, 0.1)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  marginLeft: '0.5rem'
                }}>
                  {item.count}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <button
          onClick={onApplyFilter}
          disabled={disabled || selectedHashtags.length === 0 || matchPreview.loading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            background: disabled || selectedHashtags.length === 0 || matchPreview.loading
              ? '#e5e7eb' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: disabled || selectedHashtags.length === 0 || matchPreview.loading
              ? '#9ca3af' 
              : 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: disabled || selectedHashtags.length === 0 || matchPreview.loading
              ? 'not-allowed' 
              : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: disabled || selectedHashtags.length === 0 || matchPreview.loading
              ? 'none'
              : '0 4px 15px rgba(102, 126, 234, 0.3)',
            transform: 'scale(1)',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            if (!disabled && selectedHashtags.length > 0 && !matchPreview.loading) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && selectedHashtags.length > 0 && !matchPreview.loading) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          {matchPreview.loading ? (
            <>⏳ Checking...</>
          ) : selectedHashtags.length === 0 ? (
            <>🔍 Select hashtags to filter</>
          ) : (
            <>🔍 Apply Filter ({selectedHashtags.length} tag{selectedHashtags.length !== 1 ? 's' : ''})</>
          )}
        </button>
      </div>

      {/* No hashtags available message */}
      {hashtags.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No hashtags available
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Create projects with hashtags to enable filtering
          </div>
        </div>
      )}
    </div>
  );
}
