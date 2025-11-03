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
 * WHAT: Material Icon component with automatic color inheritance
 * WHY: Consistent icon rendering with parent text color (no manual color management)
 * HOW: Uses currentColor CSS keyword to inherit color from parent element
 */
export default function MaterialIcon({ 
  name, 
  variant = 'outlined', 
  className = '', 
  style 
}: MaterialIconProps) {
  // WHAT: Determine font family based on variant
  // WHY: Google provides separate font families for each icon style
  const fontFamily = variant === 'rounded' 
    ? 'Material Icons Round' 
    : 'Material Icons Outlined';
  
  return (
    <span 
      className={`material-icons ${className}`}
      style={{ 
        fontFamily, 
        color: 'currentColor', // WHAT: Inherit text color from parent
        verticalAlign: 'middle', // WHAT: Align with adjacent text
        userSelect: 'none', // WHY: Icons shouldn't be selectable as text
        ...style 
      }}
      aria-hidden="true" // WHY: Decorative icons should be hidden from screen readers
    >
      {name}
    </span>
  );
}
