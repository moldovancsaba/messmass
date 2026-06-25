import React from 'react';
import { Paper } from '@mantine/core';
import styles from './ColoredCard.module.css';

interface ColoredCardProps {
  accentColor?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  [key: `data-${string}`]: string | number | boolean | undefined;
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
  const dataAttrs: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith('data-')) {
      dataAttrs[key] = value;
    }
  }
  const classes = [
    styles.card,
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Paper
      withBorder
      radius="lg"
      shadow="sm"
      className={classes}
      data-hoverable={hoverable ? 'true' : 'false'}
      onClick={onClick}
      style={{ '--card-accent-color': resolvedAccentColor } as React.CSSProperties}
      {...dataAttrs}
    >
      {children}
    </Paper>
  );
}
