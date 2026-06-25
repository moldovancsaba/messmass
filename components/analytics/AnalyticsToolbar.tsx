'use client';

import React from 'react';
import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import AnalyticsSectionCard from './AnalyticsSectionCard';
import styles from './AnalyticsToolbar.module.css';

export interface AnalyticsToolbarPreset {
  key: string;
  label: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
}

interface AnalyticsToolbarProps {
  title: string;
  subtitle?: string;
  presets?: AnalyticsToolbarPreset[];
  children?: React.ReactNode;
  summary?: React.ReactNode;
  accentColor?: string;
}

export default function AnalyticsToolbar({
  title,
  subtitle,
  presets = [],
  children,
  summary,
  accentColor = 'var(--mm-color-primary-500)',
}: AnalyticsToolbarProps) {
  return (
    <AnalyticsSectionCard title={title} subtitle={subtitle} accentColor={accentColor}>
      <Stack gap="md" className={styles.toolbar}>
        {presets.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" className={styles.presets}>
            {presets.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                className={`${styles.preset} ${preset.active ? styles.presetActive : ''}`.trim()}
                onClick={preset.onClick}
                variant={preset.active ? 'light' : 'default'}
                justify="flex-start"
                fullWidth
              >
                <Stack gap={2} align="flex-start">
                  <Text className={styles.presetLabel}>{preset.label}</Text>
                  {preset.description ? <Text className={styles.presetDescription}>{preset.description}</Text> : null}
                </Stack>
              </Button>
            ))}
          </SimpleGrid>
        )}
        {children ? <Stack gap="md" className={styles.controls}>{children}</Stack> : null}
        {summary ? <Stack gap="xs" className={styles.summary}>{summary}</Stack> : null}
      </Stack>
    </AnalyticsSectionCard>
  );
}
