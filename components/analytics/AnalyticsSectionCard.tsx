'use client';

import React from 'react';
import { Box, Group, Stack, Text, Title } from '@mantine/core';
import ColoredCard from '@/components/ColoredCard';
import styles from './AnalyticsSectionCard.module.css';

interface AnalyticsSectionCardProps {
  title?: string;
  subtitle?: string;
  accentColor?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  contentClassName?: string;
}

export default function AnalyticsSectionCard({
  title,
  subtitle,
  accentColor = 'var(--mm-color-primary-500)',
  actions,
  children,
  hoverable = false,
  className = '',
  contentClassName = '',
}: AnalyticsSectionCardProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <ColoredCard accentColor={accentColor} hoverable={hoverable} className={className}>
      <Stack gap="md" className={styles.card}>
        {hasHeader && (
          <Group className={styles.header} justify="space-between" align="flex-start" gap="md">
            <Stack gap={4} className={styles.heading}>
              {title && <Title order={2} className={styles.title}>{title}</Title>}
              {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
            </Stack>
            {actions ? <Group gap="xs" className={styles.actions}>{actions}</Group> : null}
          </Group>
        )}
        <Box className={`${styles.content} ${contentClassName}`.trim()}>{children}</Box>
      </Stack>
    </ColoredCard>
  );
}
