'use client';

// app/admin/login/GdsLoginShell.tsx
// WHAT: Wraps the login page in the same shared design-system provider
//     (@sovereignsquad/gds-theme + gds-core's AuthShell) that camera already
//     uses for its own sign-in screen. messmass's Mantine theme
//     (lib/ui/mantineTheme.ts) already spreads gdsTheme as its base -- this
//     completes that adoption for the one screen that never used it.
// WHY: Login was the most visibly inconsistent screen across the two apps
//     (different card style, no "SIGN IN" badge, different button/typography
//     language) even though both already run on the same identity provider.
// SCOPE: deliberately scoped to just the login (and register-redirect) route,
//     not the whole app -- avoids touching messmass's existing global
//     Mantine setup (app/providers.tsx) for everything else.

import '@sovereignsquad/gds-theme/styles.css';
import { GdsProvider } from '@sovereignsquad/gds-theme/client';

export default function GdsLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <GdsProvider
      defaultColorScheme="light"
      cssVariablesSelector=":root"
      // The outer app/providers.tsx MantineProvider already owns
      // data-mantine-color-scheme on <html> -- letting this provider also
      // manage it caused a hydration mismatch on that attribute.
      applyDocumentColorScheme={false}
    >
      {children}
    </GdsProvider>
  );
}
