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

export interface PartnerReportTheme {
  id: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  heroBg: string;
  heroGlow: string;
  pillBg: string;
  pillText: string;
  genderMale: string;
  genderFemale: string;
}

const PARTNER_THEMES: Array<{ match: RegExp; theme: PartnerReportTheme }> = [
  {
    match: /\bmtk\b/i,
    theme: {
      id: 'mtk',
      primary: '#005ca9',
      primaryDark: '#002b5c',
      primarySoft: '#eff6ff',
      accent: '#38bdf8',
      heroBg: 'linear-gradient(135deg, #001c3d 0%, #003e7e 55%, #00234d 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(56, 189, 248, 0.24) 0%, rgba(0, 92, 169, 0.08) 45%, transparent 70%)',
      pillBg: '#38bdf8',
      pillText: '#001c3d',
      genderMale: '#005ca9',
      genderFemale: '#6366f1',
    },
  },
  {
    match: /\bdvsc\b|debrecen/i,
    theme: {
      id: 'dvsc',
      primary: '#d91a2a',
      primaryDark: '#7f1d1d',
      primarySoft: '#fef2f2',
      accent: '#f87171',
      heroBg: 'linear-gradient(135deg, #3b080d 0%, #7f121d 55%, #450a0a 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(248, 113, 113, 0.22) 0%, rgba(217, 26, 42, 0.08) 45%, transparent 70%)',
      pillBg: '#fca5a5',
      pillText: '#450a0a',
      genderMale: '#d91a2a',
      genderFemale: '#0f172a',
    },
  },
  {
    match: /újpest|ujpest|\bute\b/i,
    theme: {
      id: 'ujpest',
      primary: '#6b21a8',
      primaryDark: '#3b0764',
      primarySoft: '#faf5ff',
      accent: '#c084fc',
      heroBg: 'linear-gradient(135deg, #24073d 0%, #581c87 55%, #2e1065 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(192, 132, 252, 0.24) 0%, rgba(107, 33, 168, 0.08) 45%, transparent 70%)',
      pillBg: '#d8b4fe',
      pillText: '#2e1065',
      genderMale: '#6b21a8',
      genderFemale: '#0284c7',
    },
  },
  {
    match: /ferencv[áa]ros|\bftc\b|fradi/i,
    theme: {
      id: 'ftc',
      primary: '#009640',
      primaryDark: '#064e3b',
      primarySoft: '#ecfdf5',
      accent: '#34d399',
      heroBg: 'linear-gradient(135deg, #042814 0%, #00662b 55%, #022c14 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(52, 211, 153, 0.22) 0%, rgba(0, 150, 64, 0.08) 45%, transparent 70%)',
      pillBg: '#34d399',
      pillText: '#022c22',
      genderMale: '#009640',
      genderFemale: '#0284c7',
    },
  },
  {
    match: /\bdvtk\b|di[óo]sgy[őo]r/i,
    theme: {
      id: 'dvtk',
      primary: '#c8102e',
      primaryDark: '#450a0a',
      primarySoft: '#fef2f2',
      accent: '#fb7185',
      heroBg: 'linear-gradient(135deg, #2a070d 0%, #7c0d1f 55%, #380910 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(251, 113, 133, 0.22) 0%, rgba(200, 16, 46, 0.08) 45%, transparent 70%)',
      pillBg: '#fda4af',
      pillText: '#450a0a',
      genderMale: '#c8102e',
      genderFemale: '#334155',
    },
  },
  {
    match: /\beto\b|gy[őo]r/i,
    theme: {
      id: 'eto',
      primary: '#007a33',
      primaryDark: '#052e16',
      primarySoft: '#ecfdf5',
      accent: '#34d399',
      heroBg: 'linear-gradient(135deg, #052613 0%, #005a26 55%, #031c0e 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(52, 211, 153, 0.2) 0%, rgba(0, 122, 51, 0.08) 45%, transparent 70%)',
      pillBg: '#34d399',
      pillText: '#052e16',
      genderMale: '#007a33',
      genderFemale: '#0284c7',
    },
  },
  {
    match: /pick\s*szeged|szeged/i,
    theme: {
      id: 'pick-szeged',
      primary: '#005bbb',
      primaryDark: '#002b5c',
      primarySoft: '#eff6ff',
      accent: '#60a5fa',
      heroBg: 'linear-gradient(135deg, #001d3d 0%, #00438a 55%, #00234d 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(96, 165, 250, 0.24) 0%, rgba(0, 91, 187, 0.08) 45%, transparent 70%)',
      pillBg: '#60a5fa',
      pillText: '#001d3d',
      genderMale: '#005bbb',
      genderFemale: '#e11d48',
    },
  },
  {
    match: /veszpr[ée]m/i,
    theme: {
      id: 'veszprem',
      primary: '#d00027',
      primaryDark: '#450a0a',
      primarySoft: '#fef2f2',
      accent: '#f87171',
      heroBg: 'linear-gradient(135deg, #2a060c 0%, #7d091c 55%, #3a0810 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(248, 113, 113, 0.22) 0%, rgba(208, 0, 39, 0.08) 45%, transparent 70%)',
      pillBg: '#fca5a5',
      pillText: '#450a0a',
      genderMale: '#d00027',
      genderFemale: '#334155',
    },
  },
  {
    match: /feh[ée]rv[áa]r|av19/i,
    theme: {
      id: 'fehervar',
      primary: '#003893',
      primaryDark: '#0f172a',
      primarySoft: '#eff6ff',
      accent: '#60a5fa',
      heroBg: 'linear-gradient(135deg, #091836 0%, #003893 55%, #0f172a 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(96, 165, 250, 0.24) 0%, rgba(0, 56, 147, 0.08) 45%, transparent 70%)',
      pillBg: '#60a5fa',
      pillText: '#091836',
      genderMale: '#003893',
      genderFemale: '#0ea5e9',
    },
  },
  {
    match: /szerencsej[áa]t[ée]k|tippmix|\bszrt\b/i,
    theme: {
      id: 'szrt',
      primary: '#059669',
      primaryDark: '#092618',
      primarySoft: '#ecfdf5',
      accent: '#22c55e',
      heroBg: 'linear-gradient(135deg, #092618 0%, #0d3824 50%, #061a10 100%)',
      heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(34, 197, 94, 0.18) 0%, rgba(16, 185, 129, 0.05) 45%, transparent 70%)',
      pillBg: '#22c55e',
      pillText: '#052e16',
      genderMale: '#0284c7',
      genderFemale: '#059669',
    },
  },
];

const NEUTRAL_DEFAULT_THEME: PartnerReportTheme = {
  id: 'default',
  primary: '#1d4ed8',
  primaryDark: '#0f172a',
  primarySoft: '#eff6ff',
  accent: '#38bdf8',
  heroBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)',
  heroGlow: 'radial-gradient(120% 120% at 90% 10%, rgba(56, 189, 248, 0.2) 0%, rgba(29, 78, 216, 0.06) 45%, transparent 70%)',
  pillBg: '#38bdf8',
  pillText: '#0f172a',
  genderMale: '#1d4ed8',
  genderFemale: '#6366f1',
};

function normalizeHex(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) return trimmed.slice(0, 7);
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function darkenHex(hex: string, factor = 0.42): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#0f172a';
  const r = Math.max(0, Math.round(rgb.r * factor));
  const g = Math.max(0, Math.round(rgb.g * factor));
  const b = Math.max(0, Math.round(rgb.b * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface ReportStyleInput {
  name?: string;
  heroBackground?: string;
  pieColor1?: string;
  pieColor2?: string;
  textColor?: string;
  kpiIconColor?: string;
  barColor1?: string;
  barColor2?: string;
}

/**
 * Resolves the report theme directly from the partner's Messmass `report_styles` document
 * in MongoDB. Falls back to neutral slate only when no partner style is configured.
 */
export function resolvePartnerTheme(
  style?: ReportStyleInput | null,
  partnerName?: string,
  scopeType?: string,
  viewSlug?: string
): PartnerReportTheme {
  const heroHex = normalizeHex(style?.heroBackground);
  const pie1 = normalizeHex(style?.pieColor1);
  const pie2 = normalizeHex(style?.pieColor2);
  const textHex = normalizeHex(style?.textColor);
  const bar1 = normalizeHex(style?.barColor1);

  if (heroHex || pie1 || pie2 || textHex) {
    // Primary dark brand anchor (e.g. MTK's #004c87 textColor/pieColor2, or darkened hero)
    const primary = textHex || pie2 || pie1 || heroHex || NEUTRAL_DEFAULT_THEME.primary;
    const accent = heroHex || pie1 || bar1 || primary;
    const primaryDark = darkenHex(primary, 0.45);
    const midTone = darkenHex(primary, 0.72);
    const accentRgb = hexToRgb(accent);
    const glowColor = accentRgb ? `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.24)` : 'rgba(56, 189, 248, 0.2)';
    const primaryRgb = hexToRgb(primary);
    const primarySoft = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.08)` : '#eff6ff';

    return {
      id: (style?.name || partnerName || 'custom').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      primary,
      primaryDark,
      primarySoft,
      accent,
      heroBg: `linear-gradient(135deg, ${primaryDark} 0%, ${midTone} 55%, ${primaryDark} 100%)`,
      heroGlow: `radial-gradient(120% 120% at 90% 10%, ${glowColor} 0%, transparent 65%)`,
      pillBg: accent,
      pillText: '#ffffff',
      genderMale: pie2 || primary,
      genderFemale: pie1 || accent,
    };
  }

  const candidates = [partnerName, viewSlug].filter(Boolean).join(' ');
  if (scopeType === 'hashtag' && /tippmix|szrt|szerencsej/i.test(candidates)) {
    const szrtEntry = PARTNER_THEMES[PARTNER_THEMES.length - 1];
    if (szrtEntry) return szrtEntry.theme;
  }
  return NEUTRAL_DEFAULT_THEME;
}

export const REPORT_CHART_PALETTE = {
  blue: '#1b79df',
  blueSoft: 'rgba(27, 121, 223, 0.22)',
  teal: '#03ad9f',
  tealSoft: 'rgba(3, 173, 159, 0.22)',
  violet: '#7c3aed',
  violetSoft: 'rgba(124, 58, 237, 0.2)',
  amber: '#f59e0b',
  amberSoft: 'rgba(245, 158, 11, 0.2)',
  rose: '#e11d48',
  roseSoft: 'rgba(225, 29, 72, 0.2)',
  emerald: '#10b981',
  cyan: '#06b6d4',
  indigo: '#4f46e5',
  slate: '#64748b',
  grid: '#e2e8f0',
  ink: '#102242',
  muted: '#64748b',
  surface: '#ffffff',
  series: ['#1b79df', '#03ad9f', '#7c3aed', '#f59e0b', '#e11d48', '#10b981', '#06b6d4', '#4f46e5'],
} as const;
