'use client';

import React from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import useHashtags from '../hooks/useHashtags';

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
  
  const { getCategoryColor } = useHashtags();
  
  const categoryColor = category ? getCategoryColor(category) : undefined;
  const defaultColor = '#6b7280'; // Default gray for general/unknown
  
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
          color: categoryColor || defaultColor,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          background: `${categoryColor || defaultColor}15`,
          padding: '0.125rem 0.375rem',
          borderRadius: '6px',
          lineHeight: '1',
          border: `1px solid ${categoryColor || defaultColor}30`
        }}>
          {category}
        </div>
      )}
      
      {/* Hashtag Bubble */}
      <ColoredHashtagBubble
        hashtag={hashtag}
        categoryColor={categoryColor}
        small={small}
        customStyle={customStyle}
        removable={removable}
        onRemove={onRemove}
      />
    </div>
  );
}
