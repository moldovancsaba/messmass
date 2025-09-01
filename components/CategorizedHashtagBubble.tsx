'use client';

import React from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';

interface CategorizedHashtagBubbleProps {
  hashtag: string;
  category?: string;
  small?: boolean;
  customStyle?: React.CSSProperties;
  removable?: boolean;
  onRemove?: () => void;
  showCategoryLabel?: boolean;
}

export default function CategorizedHashtagBubble({
  hashtag,
  category,
  small = false,
  customStyle = {},
  removable = false,
  onRemove,
  showCategoryLabel = true
}: CategorizedHashtagBubbleProps) {
  
  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return '#6b7280'; // Default gray for general/unknown
    
    // Category-specific colors (you can customize these)
    const categoryColors: { [key: string]: string } = {
      'time': '#ef4444',      // Red
      'sport': '#10b981',     // Green
      'city': '#3b82f6',      // Blue
      'person': '#f59e0b',    // Amber
      'event': '#8b5cf6',     // Violet
      'general': '#6b7280',   // Gray
      'vetting': '#06b6d4',   // Cyan
      'location': '#84cc16',  // Lime
    };
    
    return categoryColors[categoryName.toLowerCase()] || '#667eea';
  };
  
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
      margin: '0.125rem'
    }}>
      {/* Category Label */}
      {showCategoryLabel && category && category !== 'general' && (
        <div style={{
          fontSize: small ? '0.625rem' : '0.75rem',
          fontWeight: '600',
          color: getCategoryColor(category),
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          background: `${getCategoryColor(category)}15`,
          padding: '0.125rem 0.375rem',
          borderRadius: '6px',
          lineHeight: '1',
          border: `1px solid ${getCategoryColor(category)}30`
        }}>
          {category}
        </div>
      )}
      
      {/* Hashtag Bubble */}
      <ColoredHashtagBubble
        hashtag={hashtag}
        categoryColor={category ? getCategoryColor(category) : undefined}
        small={small}
        customStyle={customStyle}
        removable={removable}
        onRemove={onRemove}
      />
    </div>
  );
}
