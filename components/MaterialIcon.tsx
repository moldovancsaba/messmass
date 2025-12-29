/**
 * MaterialIcon Component
 * 
 * WHAT: Reusable wrapper for Google Material Icons with automatic color inheritance
 * WHY: Replace emoji with scalable, professional icons that match text color
 * HOW: Uses CSS currentColor to inherit parent text color, supports both Outlined and Rounded variants
 * 
 * Usage:
 * ```tsx
 * <MaterialIcon name="analytics" variant="outlined" />
 * <MaterialIcon name="star" variant="rounded" className="custom-class" />
 * ```
 * 
 * Browse icons: https://fonts.google.com/icons
 * 
 * Version: 10.4.0
 * Created: 2025-11-03T00:30:47.000Z
 */

import React from 'react';

interface MaterialIconProps {
  /** Icon name from Material Icons (e.g., 'analytics', 'star', 'trending_up') */
  name: string;
  
  /** Icon variant - Outlined (default) or Rounded */
  variant?: 'outlined' | 'rounded';
  
  /** Optional CSS class for additional styling */
  className?: string;
  
  /** Optional inline styles (fontSize, etc.) */
  style?: React.CSSProperties;
}

/**
 * WHAT: Normalize Material Icon name to match Google Fonts ligature format
 * WHY: Material Icons use underscores, but users may enter hyphens or spaces
 * HOW: Convert hyphens and spaces to underscores, trim whitespace, lowercase
 * 
 * @param iconName - Raw icon name from user input
 * @returns Normalized icon name compatible with Material Icons ligatures
 */
function normalizeIconName(iconName: string): string {
  if (!iconName || typeof iconName !== 'string') {
    return '';
  }
  
  // WHAT: Normalize icon name for Material Icons ligature format
  // WHY: Material Icons use underscores (e.g., "trending_up"), but users may enter hyphens or spaces
  // HOW: Convert hyphens/spaces to underscores, trim, lowercase
  return iconName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-/g, '_'); // Replace hyphens with underscores
}

/**
 * WHAT: Material Icon component with automatic color inheritance and fallback
 * WHY: Consistent icon rendering with parent text color + fallback when font fails to load
 * HOW: Uses currentColor CSS keyword + emoji fallback for reliability
 * 
 * IMPROVEMENTS (v11.46.0):
 * - Normalizes icon names (handles hyphens/spaces → underscores)
 * - Better compatibility with all Google Font Material Icons
 */
export default function MaterialIcon({ 
  name, 
  variant = 'outlined', 
  className = '', 
  style 
}: MaterialIconProps) {
  // WHAT: Normalize icon name for Material Icons ligature compatibility
  // WHY: Users may enter "trending-up" or "trending up" but Material Icons require "trending_up"
  // HOW: Convert hyphens and spaces to underscores
  const normalizedName = normalizeIconName(name);
  
  // WHAT: Determine font family based on variant
  // WHY: Google provides separate font families for each icon style
  const fontFamily = variant === 'rounded' 
    ? 'Material Icons Round' 
    : 'Material Icons Outlined';
  
  // WHAT: Fallback emoji when Material Icons font fails to load or icon name is invalid
  // WHY: Ensures charts always have a visual indicator even if Google Fonts is blocked
  // HOW: Use font stack with emoji fallback, display emoji if icon text is visible
  const fallbackEmoji = '📊'; // 📊 chart icon as universal fallback
  
  // WHAT: If icon name is empty after normalization, don't render icon
  // WHY: Prevent rendering empty/invalid icons
  if (!normalizedName) {
    return null;
  }
  
  return (
    <span 
      className={`material-icons ${className}`}
      // WHAT: Dynamic Material Icon styling with variant-based fontFamily + currentColor inheritance
      // WHY: Icon variant (outlined/rounded) determines font family, color inherits from parent text
      // NOTE: style prop spread allows parent components to override fontSize, margins, etc.
      // eslint-disable-next-line react/forbid-dom-props
      style={{ 
        fontFamily: `${fontFamily}, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`,
        color: 'currentColor', // WHAT: Inherit text color from parent
        verticalAlign: 'middle', // WHAT: Align with adjacent text
        userSelect: 'none', // WHY: Icons shouldn't be selectable as text
        fontFeatureSettings: '"liga"', // WHAT: Enable ligatures for Material Icons
        ...style 
      }}
      aria-hidden="true" // WHY: Decorative icons should be hidden from screen readers
      data-fallback={fallbackEmoji} // WHAT: Store fallback for CSS ::after pseudo-element
      data-icon-name={normalizedName} // WHAT: Store normalized name for debugging
    >
      {normalizedName}
    </span>
  );
}
