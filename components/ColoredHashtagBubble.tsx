'use client';

import { useMemo, memo } from 'react';
import useHashtagColorResolver from '../hooks/useHashtagColorResolver';
import { compareHashtagBubbleProps } from '../lib/performanceUtils';
import styles from './ColoredHashtagBubble.module.css';

/* What: Modernized hashtag bubble component with TailAdmin V2 styling
   Why: Professional pill design with proper interaction states
   
   Changes:
   - CSS Modules for better styling encapsulation
   - Improved accessibility with proper focus states
   - Smooth animations and transitions
   - Better touch targets for mobile */

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

// WHAT: Memoized hashtag bubble component to prevent unnecessary re-renders
// WHY: Hashtags are rendered in large lists; memoization reduces render overhead
function ColoredHashtagBubbleComponent({ 
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
  // WHAT: Defensive normalization to avoid React error #31 when a non-string sneaks in.
  // WHY: Some upstream code may accidentally pass objects like {hashtag,count}.
  const hObj: any = (hashtag as unknown) as any;
  const hStr: string = typeof hObj === 'string' ? hObj : (hObj && typeof hObj.hashtag === 'string' ? hObj.hashtag : '');

  // Use the intelligent color resolver for all color determination
  const { getHashtagColorInfo, resolveHashtagColor, findHashtagCategory } = useHashtagColorResolver();

  // Find which category this hashtag belongs to (if any)
  const hashtagCategory = useMemo(() => {
    if (projectCategorizedHashtags) {
      return findHashtagCategory(hStr, projectCategorizedHashtags);
    }
    return undefined;
  }, [hStr, projectCategorizedHashtags, findHashtagCategory]);

  // Determine the background color using the intelligent resolver or explicit color
  const backgroundColor = useMemo(() => {
    // If explicit categoryColor is provided, use it (highest priority)
    if (categoryColor) {
      return categoryColor;
    }
    
    // If auto-resolve is enabled and we have project context, use intelligent resolution
    if (autoResolveColor && projectCategorizedHashtags) {
      return resolveHashtagColor(hStr, projectCategorizedHashtags);
    }
    
    // Legacy fallback: use individual hashtag color or default
    const colorInfo = getHashtagColorInfo(hStr, projectCategorizedHashtags);
    return colorInfo.effectiveColor;
  }, [categoryColor, autoResolveColor, projectCategorizedHashtags, resolveHashtagColor, hStr, getHashtagColorInfo]);

  // Determine the display text
  const displayText = useMemo(() => {
    if (showCategoryPrefix && hashtagCategory) {
      return `${hashtagCategory}:${hStr}`;
    }
    return hStr;
  }, [showCategoryPrefix, hashtagCategory, hStr]);
  /* What: Build CSS Module classes dynamically
     Why: Combine base styles with variant modifiers */
  const bubbleClasses = [
    styles.hashtag,
    small && styles.hashtagSmall,
    interactive && styles.hashtagInteractive,
    removable && styles.hashtagRemovable,
    className
  ].filter(Boolean).join(' ');

  // Handle empty hashtag gracefully
  if (!hStr || !hStr.trim()) {
    return null;
  }

  // Handle click functionality
  const handleClick = () => {
    if (interactive && onClick) {
      onClick(hStr);
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

  // WHAT: Validate backgroundColor before using in style
  // WHY: React calls .trim() on style values, will crash if undefined
  const safeBackgroundColor = (backgroundColor && typeof backgroundColor === 'string' && backgroundColor.trim()) ? backgroundColor : '#3b82f6';
  
  return (
    <span 
      className={bubbleClasses}
      style={{ 
        backgroundColor: safeBackgroundColor,
        background: safeBackgroundColor, // Ensure both properties are set
        color: 'white', // Force text color to always be white
        cursor: interactive ? 'pointer' : 'default',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: removable ? '0.25rem' : '0',
        ...customStyle 
      }}
      title={`Hashtag color: ${safeBackgroundColor}`}
      onClick={handleClick}
    >
      #{displayText}
      {removable && (
        <button
          onClick={handleRemove}
          className={`${styles.removeButton} ${small ? styles.removeButtonSmall : ''}`}
          title="Remove hashtag"
          aria-label="Remove hashtag"
        >
          ×
        </button>
      )}
    </span>
  );
}

// WHAT: Export memoized version with custom comparison function
// WHY: Prevents re-renders when props haven't meaningfully changed
export default memo(ColoredHashtagBubbleComponent, compareHashtagBubbleProps);
