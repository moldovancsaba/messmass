// lib/theme/interactiveReportPalette.ts
// WHAT: Centralized color constants for Fanmass interactive reports, clustering badges, and admin brand assets.
// WHY: lib/theme/ is the approved lane for literal data and theme colors under GDS compliance.

export const INTERACTIVE_REPORT_THEME = {
  // Brand defaults (SZRT)
  heroBackground: '#88ca45ff',
  pieColor1: '#4f7a28ff',
  pieColor2: '#86c680ff',

  // Common UI neutrals
  white: '#ffffff',
  black: '#000000',
  navyBrand: '#0f2c4a',
  blueDark: '#1e3a8a',
  bluePrimary: '#2563eb',
  bluePrimaryStrong: '#1d4ed8',
  blueAccent: '#3b82f6',
  blueLight: '#eff6ff',
  slateDark: '#0f172a',
  slateText: '#1e293b',
  slateMedium: '#334155',
  slateMuted: '#64748b',
  slateLight: '#94a3b8',
  slateBorder: '#cbd5e1',
  slateLightBorder: '#e2e8f0',
  slateSubtleBg: '#f8fafc',
  grayBorder: '#f1f5f9',
  grayBg: '#fafafa',

  // Alert & Badge Accents
  amberBg: '#fef3c7',
  amberText: '#92400e',
  yellowHighlightBg: '#fef08a',
  yellowHighlightText: '#854d0e',
  greenText: '#15803d',
  greenPrimary: '#16a34a',
  greenBg: '#dcfce7',
  redBg: '#fee2e2',
  redText: '#991b1b',
  pinkBg: '#fdf2f8',
  pinkBorder: '#fbcfe8',
  pinkText: '#831843',
  pinkDark: '#9d174d',
  pinkDeep: '#be185d',

  // Category Badge Colors
  badges: {
    sportswearBg: '#e0e7ff',
    sportswearColor: '#3730a3',
    bettingLotteryBg: 'rgba(136, 202, 69, 0.2)',
    bettingLotteryBg25: 'rgba(136, 202, 69, 0.25)',
    bettingLotteryColor: '#1b4332',
    bankingBg: '#dcfce7',
    bankingColor: '#166534',
    automotiveBg: '#ffedd5',
    automotiveColor: '#9a3412',
    telecomBg: '#fee2e2',
    telecomColor: '#991b1b',
    beverageBg: '#d1fae5',
    beverageColor: '#065f46',
    venuesBg: '#e0f2fe',
    venuesColor: '#075985',
    defaultBg: '#f1f5f9',
    defaultColor: '#475569',
  },
} as const;
