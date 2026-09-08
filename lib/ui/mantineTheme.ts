import { createPublicBrandTheme } from '@sovereignsquad/gds-theme/client';
import { MESSMASS_AMBER, MESSMASS_BLUE, MESSMASS_GREEN, MESSMASS_RED } from '../theme/mantinePalette';

// WHAT: messmass's brand layer over the base GDS theme.
// WHY: `createPublicBrandTheme` deep-merges `overrides` over `gdsTheme` via
//      Mantine's own `mergeMantineTheme` — no need to spread `gdsTheme.colors`/
//      `gdsTheme.components` manually, that would just re-merge what the base
//      theme already provides.
export const messmassMantineTheme = createPublicBrandTheme({
  overrides: {
    primaryColor: 'messmassBlue',
    fontFamily: 'var(--active-font, var(--font-inter)), var(--font-inter), system-ui, sans-serif',
    headings: {
      fontFamily: 'var(--active-font, var(--font-inter)), var(--font-inter), system-ui, sans-serif',
      fontWeight: '700',
    },
    colors: {
      messmassBlue: MESSMASS_BLUE,
      messmassGreen: MESSMASS_GREEN,
      messmassAmber: MESSMASS_AMBER,
      messmassRed: MESSMASS_RED,
    },
    components: {
      Button: {
        defaultProps: {
          radius: 'md',
        },
      },
      Paper: {
        defaultProps: {
          radius: 'lg',
        },
      },
      Card: {
        defaultProps: {
          radius: 'lg',
          padding: 'lg',
        },
      },
      Modal: {
        defaultProps: {
          radius: 'lg',
          centered: true,
        },
      },
      TextInput: {
        defaultProps: {
          radius: 'md',
        },
      },
      Select: {
        defaultProps: {
          radius: 'md',
        },
      },
    },
  },
});
