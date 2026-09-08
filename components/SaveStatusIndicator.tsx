// components/SaveStatusIndicator.tsx - Centralized save status indicator
// WHAT: Reusable component showing save operation status
// WHY: Consistent UX feedback across all admin pages
// HOW: Display 💾 Saving..., ✅ Saved, ❌ Error, 📝 Ready based on status

'use client';

import React from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

/**
 * WHAT: Centralized save status indicator component
 * WHY: Provide consistent visual feedback across all admin forms
 * HOW: Displays icon + text based on current save state
 * 
 * Usage:
 * ```tsx
 * const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
 * 
 * const handleSave = async () => {
 *   setSaveStatus('saving');
 *   try {
 *     await saveData();
 *     setSaveStatus('saved');
 *     setTimeout(() => setSaveStatus('idle'), 2000);
 *   } catch (error) {
 *     setSaveStatus('error');
 *     setTimeout(() => setSaveStatus('idle'), 3000);
 *   }
 * };
 * 
 * <SaveStatusIndicator status={saveStatus} />
 * ```
 */
export default function SaveStatusIndicator({ status, className = '' }: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: '💾',
          text: 'Saving...',
          color: 'var(--mm-color-primary-500)', // Blue
          bgColor: 'color-mix(in srgb, var(--mm-color-primary-500) 10%, transparent)'
        };
      case 'saved':
        return {
          icon: '✅',
          text: 'Saved',
          color: 'var(--mm-success)', // Green
          bgColor: 'color-mix(in srgb, var(--mm-success) 10%, transparent)'
        };
      case 'error':
        return {
          icon: '❌',
          text: 'Save Error',
          color: 'var(--mm-error)', // Red
          bgColor: 'color-mix(in srgb, var(--mm-error) 10%, transparent)'
        };
      case 'idle':
      default:
        return {
          icon: '📝',
          text: 'Ready',
          color: 'var(--mm-gray-500)', // Gray
          bgColor: 'color-mix(in srgb, var(--mm-gray-500) 10%, transparent)'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`save-status-indicator ${className}`}
      // WHAT: Dynamic status-based styling (saving/saved/error/idle)
      // WHY: Each save state needs distinct color + background for UX clarity
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: config.bgColor,
        color: config.color,
        fontSize: '0.875rem',
        fontWeight: '600',
        transition: 'all 0.3s ease',
      }}
    >
      {/* WHAT: Emoji icon fontSize override */}
      {/* WHY: Slightly larger emoji for visual prominence */}
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <span style={{ fontSize: '1rem' }}>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
