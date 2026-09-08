// WHAT: Report-style colour DATA — the system default 26-colour ReportStyle set plus the
//       messmass.com landing preset that scripts/seed-messmass-landing.ts writes to MongoDB.
// WHY: These values are stored per style document and injected as CSS variables at render
//      time (--chartBackground, --barColor1, ...); they are content, not UI chrome, so they
//      stay literal here. The defaults deliberately match the --mm-* tokens in theme.css.

/** Default box-shadow for landing/report cards (the `cardShadow` style field). */
export const DEFAULT_CARD_SHADOW = '0 1px 3px 0 rgba(0,0,0,0.05)';

/** Colour fields of DEFAULT_STYLE in lib/reportStyleTypes.ts (8-digit RRGGBBAA hex). */
export const DEFAULT_REPORT_STYLE_COLORS = {
  // Hero Section
  heroBackground: '#f8fafcff',
  headingColor: '#1f2937ff',
  exportButtonBackground: '#ffffffff',
  exportButtonText: '#3b82f6ff',
  exportButtonHoverBackground: '#f9fafbff',

  // Chart Container
  chartBackground: '#ffffffff',
  chartBorder: '#f3f4f6ff',

  // Chart Typography
  chartTitleColor: '#3b82f6ff',
  chartLabelColor: '#374151ff',
  chartValueColor: '#111827ff',
  textColor: '#111827ff',

  // KPI Charts
  kpiIconColor: '#3b82f6ff',

  // Bar Charts
  barColor1: '#3b82f6ff',
  barColor2: '#10b981ff',
  barColor3: '#10b981ff',
  barColor4: '#f59e0bff',
  barColor5: '#ef4444ff',

  // Pie Charts
  pieColor1: '#3b82f6ff',
  pieColor2: '#10b981ff',
  pieBorderColor: '#3b82f6ff',

  // Chart States
  chartNoDataBackground: '#f9fafbff',
  chartNoDataBorder: '#d1d5dbff',
  chartNoDataText: '#6b7280ff',
  chartErrorBackground: '#fef2f2ff',
  chartErrorText: '#991b1bff',
  chartTooltipBackground: '#1f2937f2',
  chartTooltipText: '#ffffffff',

  // Landing (defaults match theme.css --mm-landing-hero-*)
  landingHeroBgStart: '#0f172aff',
  landingHeroBgMid: '#1e293bff',
  landingHeroBgEnd: '#0f172aff',
  landingHeroText: '#f8fafcff',
  landingHeroTextMuted: '#cbd5e1ff',
  landingHeroBorder: '#475569ff',
  landingHeroBorderHover: '#94a3b8ff',
  landingHeroTextHover: '#f1f5f9ff',
  landingPageBg: '#f8fafcff',
} as const;

/** Colours of the "messmass.com" landing report style seeded by scripts/seed-messmass-landing.ts. */
export const LANDING_REPORT_STYLE_COLORS = {
  heroBackground: '#0f172aff',
  headingColor: '#f8fafcff',
  exportButtonBackground: '#3b82f6ff',
  exportButtonText: '#ffffffff',
  exportButtonHoverBackground: '#2563ebff',
  chartBackground: '#ffffffff',
  chartBorder: '#e2e8f0ff',
  chartTitleColor: '#1e293bff',
  chartLabelColor: '#64748bff',
  chartValueColor: '#0f172aff',
  textColor: '#334155ff',
  kpiIconColor: '#3b82f6ff',
  barColor1: '#3b82f6ff',
  barColor2: '#10b981ff',
  barColor3: '#f59e0bff',
  barColor4: '#8b5cf6ff',
  barColor5: '#ec4899ff',
  pieColor1: '#3b82f6ff',
  pieColor2: '#10b981ff',
  pieBorderColor: '#e2e8f0ff',
  chartNoDataBackground: '#f8fafcff',
  chartNoDataBorder: '#e2e8f0ff',
  chartNoDataText: '#64748bff',
  chartErrorBackground: '#fef2f2ff',
  chartErrorText: '#dc2626ff',
  chartTooltipBackground: '#1e293bff',
  chartTooltipText: '#f8fafcff',
} as const;
