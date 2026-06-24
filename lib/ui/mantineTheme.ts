import { createTheme } from '@mantine/core';
import { gdsTheme } from '@doneisbetter/gds-theme';

export const messmassMantineTheme = createTheme({
  ...gdsTheme,
  primaryColor: 'messmassBlue',
  fontFamily: 'var(--active-font, var(--font-inter)), var(--font-inter), system-ui, sans-serif',
  headings: {
    ...gdsTheme.headings,
    fontFamily: 'var(--active-font, var(--font-inter)), var(--font-inter), system-ui, sans-serif',
    fontWeight: '700',
  },
  colors: {
    ...gdsTheme.colors,
    messmassBlue: [
      '#eef4ff',
      '#dae6ff',
      '#b3cfff',
      '#86b3ff',
      '#5a98ff',
      '#387fff',
      '#2563eb',
      '#1d4ed8',
      '#1e40af',
      '#1e3a8a',
    ],
    messmassGreen: [
      '#edfdf5',
      '#d3fae7',
      '#a7f3d0',
      '#6ee7b7',
      '#34d399',
      '#10b981',
      '#059669',
      '#047857',
      '#065f46',
      '#064e3b',
    ],
    messmassAmber: [
      '#fffbeb',
      '#fef3c7',
      '#fde68a',
      '#fcd34d',
      '#fbbf24',
      '#f59e0b',
      '#d97706',
      '#b45309',
      '#92400e',
      '#78350f',
    ],
    messmassRed: [
      '#fef2f2',
      '#fee2e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444',
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d',
    ],
  },
  components: {
    ...gdsTheme.components,
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
});
