'use client';

import { GdsProvider } from '@sovereignsquad/gds-theme/client';

import { HashtagDataProvider } from '@/contexts/HashtagDataProvider';
import { messmassMantineTheme } from '@/lib/ui/mantineTheme';

interface AppProvidersProps {
  children: React.ReactNode;
}

// WHAT: Single root GdsProvider — owns MantineProvider, ModalsProvider, and
//       Notifications internally.
// WHY: GDS's docs name a second MantineProvider/GdsProvider as the project's
//      highest governance risk. GdsProvider's own Notifications mount takes no
//      position prop (defaults to Mantine's 'bottom-right'), but nothing in
//      this app calls notifications.show() — the previous <Notifications
//      position="top-right" /> mount had zero call sites, so there's no
//      visible behavior to preserve.
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <GdsProvider theme={messmassMantineTheme} defaultColorScheme="light">
      <HashtagDataProvider>{children}</HashtagDataProvider>
    </GdsProvider>
  );
}
