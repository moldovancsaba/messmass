'use client';

import React from 'react';
import { Box, Stack, Text, Title } from '@mantine/core';
import ColoredCard from '@/components/ColoredCard';
import styles from './AnalyticsStatePanel.module.css';

type AnalyticsStateVariant = 'loading' | 'empty' | 'error';

interface AnalyticsStatePanelProps {
  variant: AnalyticsStateVariant;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const VARIANT_ICON: Record<AnalyticsStateVariant, string> = {
  loading: '⏳',
  empty: '📭',
  error: '⚠️',
};

const VARIANT_ACCENT: Record<AnalyticsStateVariant, string> = {
  loading: 'var(--mm-color-primary-500)',
  empty: 'var(--mm-chart-cyan)',
  error: 'var(--mm-error)',
};

export default function AnalyticsStatePanel({
  variant,
  title,
  description,
  action,
  className = '',
}: AnalyticsStatePanelProps) {
  return (
    <ColoredCard accentColor={VARIANT_ACCENT[variant]} hoverable={false} className={className}>
      <Stack align="center" justify="center" gap="md" className={styles.state}>
        <Box className={styles.icon} aria-hidden="true">
          {VARIANT_ICON[variant]}
        </Box>
        <Stack gap="xs" className={styles.copy}>
          <Title order={3} className={styles.title}>{title}</Title>
          <Text className={styles.description}>{description}</Text>
        </Stack>
        {action ? <Box className={styles.action}>{action}</Box> : null}
      </Stack>
    </ColoredCard>
  );
}
