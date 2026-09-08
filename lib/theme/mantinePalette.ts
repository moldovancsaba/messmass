import type { MantineColorsTuple } from '@mantine/core';

// WHAT: The four messmass brand colour scales registered on the Mantine theme
//       (lib/ui/mantineTheme.ts) as messmassBlue / messmassGreen / messmassAmber / messmassRed.
// WHY: Mantine emits them as --mantine-color-messmass*-N CSS variables; theme.css aliases
//      its --mm-* tokens onto those. This module is the single literal source.

export const MESSMASS_BLUE: MantineColorsTuple = [
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
];

export const MESSMASS_GREEN: MantineColorsTuple = [
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
];

export const MESSMASS_AMBER: MantineColorsTuple = [
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
];

export const MESSMASS_RED: MantineColorsTuple = [
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
];
