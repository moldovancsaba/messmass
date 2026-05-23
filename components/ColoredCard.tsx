/* WHAT: Centralized Mantine-backed card component with left border accent
 * WHY: Shared card surface across admin and analytics flows while preserving
 *      the existing API during the Mantine migration
 */

import React from 'react';
import { Paper } from '@mantine/core';

interface ColoredCardProps {
  /** Optional color for the left border accent (default: transparent/no accent) */
  accentColor?: string;
  /** Optional CSS class names */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional hover effect */
  hoverable?: boolean;
  /** Optional data attributes (e.g., data-pdf-block) */
  [key: string]: any;
}

export default function ColoredCard({
  accentColor,
  className = '',
  children,
  onClick,
  hoverable = true,
  ...rest
}: ColoredCardProps) {
  const resolvedAccentColor = (accentColor && typeof accentColor === 'string' && accentColor.trim())
    ? accentColor
    : 'transparent';
  const dataAttrs = Object.keys(rest)
    .filter(key => key.startsWith('data-'))
    .reduce((obj, key) => ({ ...obj, [key]: rest[key] }), {});

  return (
    <Paper
      withBorder
      radius="lg"
      shadow="sm"
      className={className}
      data-hoverable={hoverable ? 'true' : 'false'}
      onClick={onClick}
      style={{
        background: 'var(--mm-white)',
        borderColor: 'var(--mm-border-color-light)',
        borderLeft: `4px solid ${resolvedAccentColor}`,
        padding: 'var(--mm-space-4)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      styles={{
        root: {
          '&[data-hoverable="true"]:hover': {
            boxShadow: 'var(--mm-shadow-md)',
            transform: 'translateY(-2px)',
            borderColor: 'var(--mm-border-color-default)',
          },
        },
      }}
      {...dataAttrs}
    >
      {children}
    </Paper>
  );
}
