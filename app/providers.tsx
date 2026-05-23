'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

import { HashtagDataProvider } from '@/contexts/HashtagDataProvider';
import { messmassMantineTheme } from '@/lib/ui/mantineTheme';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <MantineProvider theme={messmassMantineTheme} defaultColorScheme="light">
      <ModalsProvider>
        <Notifications position="top-right" />
        <HashtagDataProvider>{children}</HashtagDataProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
