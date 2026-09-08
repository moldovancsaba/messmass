// WHAT: Chart DATA colours — values that are written into chart configurations
//       (MongoDB documents, seed scripts, auto-generated chart blocks) or painted onto a
//       <canvas> by Chart.js, where CSS custom properties cannot resolve.
// WHY: These are content, not UI chrome, so they legitimately stay literal. Every hex
//      value here mirrors a --mm-chart-* / --mm-color-* token in app/styles/theme.css; UI
//      surfaces must use those tokens, never this module.

export const CHART_COLOR = {
  blue: '#3b82f6',
  blueDark: '#2563eb',
  green: '#10b981',
  greenDark: '#059669',
  greenBright: '#22c55e',
  amber: '#f59e0b',
  yellow: '#eab308',
  orange: '#f97316',
  orangeDark: '#ea580c',
  red: '#ef4444',
  redDark: '#dc2626',
  pink: '#ec4899',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  gray: '#9ca3af',
  grayMuted: '#6b7280',
  /** Placeholder for chart elements that carry no colour of their own. */
  neutral: '#cccccc',
  // Series colours the original stats charts shipped with; seeded charts still store them.
  femalePink: '#ff6b9d',
  maleBlue: '#4a90e2',
  jerseyViolet: '#7b68ee',
  flagsOrange: '#ffa726',
  capGreen: '#66bb6a',
  otherRed: '#ef5350',
} as const;

/** Rotating series palette used by line/bar/pie charts (lib/chartTheme.ts). */
export const CHART_PALETTE_HEX = [
  CHART_COLOR.blue,
  CHART_COLOR.green,
  CHART_COLOR.purple,
  CHART_COLOR.orange,
  CHART_COLOR.pink,
  CHART_COLOR.cyan,
  CHART_COLOR.yellow,
  CHART_COLOR.red,
  CHART_COLOR.indigo,
  CHART_COLOR.teal,
] as const;

/** Default per-element colours assigned when a chart type changes in the algorithm manager. */
export const CHART_ELEMENT_COLORS = [
  CHART_COLOR.blue,
  CHART_COLOR.green,
  CHART_COLOR.amber,
  CHART_COLOR.purple,
  CHART_COLOR.red,
] as const;

/** Canvas-painted chrome (tooltip, legend, axes) for Chart.js — cannot read CSS variables. */
export const CHART_THEME_COLORS = {
  tooltipBackground: 'rgba(31, 41, 55, 0.95)',
  tooltipBorder: '#d1d5db',
  tooltipText: '#ffffff',
  legendText: '#4b5563',
  axisText: '#6b7280',
  axisBorder: '#e5e7eb',
  gridLine: 'rgba(229, 231, 235, 0.5)',
} as const;

/** Fallbacks used when a report style does not define --pieColor1 / --pieColor2. */
export const REPORT_PIE_FALLBACK_COLORS = [CHART_COLOR.blue, CHART_COLOR.green] as const;
