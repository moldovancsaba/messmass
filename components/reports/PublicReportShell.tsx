'use client';

import { Alert, Box, Container, Loader, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconChartBar } from '@tabler/icons-react';

interface PublicReportShellProps {
  children: React.ReactNode;
}

interface PublicReportStateProps {
  title: string;
  message?: string;
  meta?: string;
  kind?: 'loading' | 'error' | 'empty';
}

export function PublicReportShell({ children }: PublicReportShellProps) {
  return (
    <Box component="main" bg="var(--mantine-color-gray-0)" mih="100vh" py={{ base: 'md', sm: 'xl' }}>
      <Container size="xl">
        <Stack gap="lg">{children}</Stack>
      </Container>
    </Box>
  );
}

export function PublicReportState({
  title,
  message,
  meta,
  kind = 'empty',
}: PublicReportStateProps) {
  if (kind === 'loading') {
    return (
      <PublicReportShell>
        <Stack align="center" gap="md" py="xl" role="status" aria-live="polite">
          <Loader aria-label={title} />
          <Text c="dimmed">{title}</Text>
        </Stack>
      </PublicReportShell>
    );
  }

  return (
    <PublicReportShell>
      <Alert
        color={kind === 'error' ? 'red' : 'blue'}
        icon={kind === 'error' ? <IconAlertTriangle size={18} /> : <IconChartBar size={18} />}
        title={<Title order={2}>{title}</Title>}
        role={kind === 'error' ? 'alert' : 'status'}
      >
        {message && <Text>{message}</Text>}
        {meta && (
          <Text c="dimmed" size="sm" mt="xs">
            {meta}
          </Text>
        )}
      </Alert>
    </PublicReportShell>
  );
}
