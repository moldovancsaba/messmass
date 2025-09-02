'use client';

import { useMemo } from 'react';
import useHashtagColorResolver from '../hooks/useHashtagColorResolver';

interface ColoredHashtagBubbleProps {
  hashtag: string;
  className?: string;
  small?: boolean;
  customStyle?: React.CSSProperties;
  interactive?: boolean;
  onClick?: (hashtag: string) => void;
  showCategoryPrefix?: boolean;
  categoryColor?: string;
  removable?: boolean;
  onRemove?: () => void;
  // New props for intelligent color resolution
  projectCategorizedHashtags?: { [categoryName: string]: string[] };
  autoResolveColor?: boolean;
}

export default function ColoredHashtagBubble({ 
  hashtag, 
  className = '', 
  small = false, 
  customStyle = {},
  interactive = false,
  onClick,
  showCategoryPrefix = false,
  categoryColor,
  removable = false,
  onRemove,
  projectCategorizedHashtags,
  autoResolveColor = false
}: ColoredHashtagBubbleProps) {
  // Use the intelligent color resolver for all color determination
  const { getHashtagColorInfo, resolveHashtagColor, findHashtagCategory } = useHashtagColorResolver();

  // Find which category this hashtag belongs to (if any)
  const hashtagCategory = useMemo(() => {
    if (projectCategorizedHashtags) {
      return findHashtagCategory(hashtag, projectCategorizedHashtags);
    }
    return undefined;
  }, [hashtag, projectCategorizedHashtags, findHashtagCategory]);

  // Determine the background color using the intelligent resolver or explicit color
  const backgroundColor = useMemo(() => {
    // If explicit categoryColor is provided, use it (highest priority)
    if (categoryColor) {
      return categoryColor;
    }
    
    // If auto-resolve is enabled and we have project context, use intelligent resolution
    if (autoResolveColor && projectCategorizedHashtags) {
      return resolveHashtagColor(hashtag, projectCategorizedHashtags);
    }
    
    // Legacy fallback: use individual hashtag color or default
    const colorInfo = getHashtagColorInfo(hashtag, projectCategorizedHashtags);
    return colorInfo.effectiveColor;
  }, [categoryColor, autoResolveColor, projectCategorizedHashtags, resolveHashtagColor, hashtag, getHashtagColorInfo]);

  // Determine the display text
  const displayText = useMemo(() => {
    if (showCategoryPrefix && hashtagCategory) {
      return `${hashtagCategory}:${hashtag}`;
    }
    return hashtag;
  }, [showCategoryPrefix, hashtagCategory, hashtag]);
  const bubbleClasses = `hashtag ${small ? 'hashtag-small' : ''} ${interactive ? 'hashtag-interactive' : ''} ${removable ? 'hashtag-removable' : ''} ${className}`.trim();

  // Handle empty hashtag gracefully
  if (!hashtag || !hashtag.trim()) {
    return null;
  }

  // Handle click functionality
  const handleClick = () => {
    if (interactive && onClick) {
      onClick(hashtag);
    }
  };

  // Handle remove functionality
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (removable && onRemove) {
      onRemove();
    }
  };

  // Enable debug logging for category resolution
  if (process.env.NODE_ENV === 'development' && autoResolveColor) {
    const colorInfo = getHashtagColorInfo(hashtag, projectCategorizedHashtags);
    console.log(`🎨 Color Resolution for "${hashtag}":`, {
      category: colorInfo.category,
      categoryColor: colorInfo.categoryColor,
      individualColor: colorInfo.individualColor,
      effectiveColor: colorInfo.effectiveColor,
      finalBackground: backgroundColor,
      displayText: displayText
    });
  }

  return (
    <span 
      className={bubbleClasses}
      style={{ 
        backgroundColor: backgroundColor,
        background: backgroundColor, // Ensure both properties are set
        color: 'white', // Force text color to always be white
        cursor: interactive ? 'pointer' : 'default',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: removable ? '0.25rem' : '0',
        ...customStyle 
      }}
      title={`Hashtag color: ${backgroundColor}`}
      onClick={handleClick}
    >
      #{displayText}
      {removable && (
        <button
          onClick={handleRemove}
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: small ? '14px' : '16px',
            height: small ? '14px' : '16px',
            fontSize: small ? '8px' : '10px',
            marginLeft: '0.25rem',
            padding: '0',
            lineHeight: '1'
          }}
          title="Remove hashtag"
        >
          ×
        </button>
      )}
    </span>
  );
}
