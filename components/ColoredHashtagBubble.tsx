'use client';

import { useMemo, memo } from 'react';
import { ChoiceChip } from '@sovereignsquad/gds-core/client';
import type React from 'react';
import useHashtagColorResolver from '../hooks/useHashtagColorResolver';
import { compareHashtagBubbleProps } from '../lib/performanceUtils';
import styles from './ColoredHashtagBubble.module.css';

/* What: Hashtag bubble rendered through GDS's ChoiceChip/Badge primitive
   Why: Replaces a hand-rolled <span>/<button> pill with the shared design
   system's chip so hashtags get token-driven styling instead of a
   page-local pattern. See docs/components/components-reusable-components-inventory.md
   ("Hashtag System" section) for the full rationale. */

// WHAT: ChoiceChipProps doesn't declare every native attribute Badge forwards once it
// renders with onClick (component="button" internally, per Mantine's polymorphic Badge)
// -- `title` is a real, runtime-forwarded prop, just not typed on GDS's ChoiceChip
// wrapper. Cast once here rather than reaching for `any` at the call site.
const HashtagChoiceChip = ChoiceChip as React.ComponentType<
  React.ComponentProps<typeof ChoiceChip> & { title?: string }
>;

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
  // WHAT: Optional accessible-name override for interactive chips.
  // WHY: This component is reused for genuinely different actions (toggle a filter,
  // open a share popup, ...) -- it cannot guess which one a given caller means, so it
  // must not hardcode one. Omit it and the chip's visible text ("#hashtag") serves as
  // the accessible name, which is always at least accurate, if generic.
  ariaLabel?: string;
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
  ariaLabel,
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

  // Handle empty hashtag gracefully
  if (!hStr || !hStr.trim()) {
    return null;
  }

  // Handle click functionality
  const handleClick: React.MouseEventHandler<HTMLElement> = () => {
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

  // WHAT: interactive chips render as a real <button> (ChoiceChip's onClick branch); a
  // removable chip that's ALSO interactive can't nest a second real <button> inside a
  // <button> (invalid HTML). In that combination the "×" is decorative only — the whole
  // chip already removes on click, which matches every current call site where onClick
  // and onRemove invoke the same handler. A removable-but-not-interactive chip renders as
  // a plain (non-button) Badge, so a real nested remove <button> stays valid there.
  const removeGlyph = removable ? (
    interactive ? (
      <span aria-hidden className={`${styles.removeGlyph} ${small ? styles.removeGlyphSmall : ''}`}>×</span>
    ) : (
      <button
        type="button"
        onClick={handleRemove}
        className={`${styles.removeButton} ${small ? styles.removeButtonSmall : ''}`}
        title="Remove hashtag"
        aria-label="Remove hashtag"
      >
        ×
      </button>
    )
  ) : null;

  return (
    <HashtagChoiceChip
      label={
        <>
          #{displayText}
          {removeGlyph}
        </>
      }
      active // always filled/solid, matching this bubble's original always-colored look
      color={safeBackgroundColor}
      size={small ? 'xs' : 'sm'}
      className={className}
      style={customStyle}
      title={`Hashtag color: ${safeBackgroundColor}`}
      onClick={interactive ? handleClick : undefined}
      aria-label={ariaLabel}
    />
  );
}

// WHAT: Export memoized version with custom comparison function
// WHY: Prevents re-renders when props haven't meaningfully changed
export default memo(ColoredHashtagBubbleComponent, compareHashtagBubbleProps);
