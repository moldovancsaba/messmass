// WHAT: Colour-string helpers and the few raw hex constants that must stay literal.
// WHY: `<input type="color">` only accepts 6-digit hex, and hex->rgba converters have
//      to emit a real `rgba(...)` string. lib/theme/ is the one lane the GDS compliance
//      check reserves for literal colour values; every UI surface uses theme.css tokens.

export const HEX_WHITE = '#ffffff';
export const HEX_BLACK = '#000000';
/** 8-digit (RRGGBBAA) opaque black, the ReportStyle normalisation fallback. */
export const HEX8_OPAQUE_BLACK = '#000000ff';

/** Build an `rgba(r, g, b, a)` CSS string from numeric channels. */
export function rgbaString(r: number, g: number, b: number, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * WHAT: Relative luminance (WCAG) of a CSS colour given as #RGB, #RRGGBB or
 *   #RRGGBBAA. Returns null when the string is not a hex colour.
 * WHY: Surfaces that sit on a user-chosen background have to pick their own
 *   foreground. The password gate was authored as white-on-glass, which is
 *   unreadable the moment a report's background is light -- white text on its
 *   card measured a contrast ratio of 1.04 on #f8fafc and 1.00 on white.
 *   Deciding from luminance makes the surface correct for any background rather
 *   than for the one it happened to be designed against.
 */
export function hexLuminance(hex: string): number | null {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(h.slice(0, 2), 16));
  const g = channel(parseInt(h.slice(2, 4), 16));
  const b = channel(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** True when a background is light enough that dark foreground text reads better. */
export function isLightBackground(hex: string): boolean {
  const l = hexLuminance(hex);
  // Mid-point of the WCAG luminance range; null (unparseable) keeps the
  // historical dark-background assumption.
  return l === null ? false : l > 0.35;
}

/**
 * WHAT: The password gate's two palettes, chosen at runtime from the report
 *   background's luminance (see isLightBackground).
 * WHY: The gate renders over a background the report owns, so it cannot commit
 *   to one foreground. These live here rather than in the component because
 *   gds-compliance treats any rgb()/rgba() literal outside the theme lane as a
 *   raw colour -- and because a surface palette is theme data, not view logic.
 *   Each entry is token-based; only the alpha compositing is literal.
 */
export const GATE_PALETTE = {
  light: {
    '--gate-fg': 'var(--mm-gray-900)',
    '--gate-muted': 'var(--mm-gray-600)',
    '--gate-surface': 'rgba(var(--mm-black-rgb), 0.04)',
    '--gate-border': 'rgba(var(--mm-black-rgb), 0.12)',
    '--gate-input-bg': 'var(--mm-white)',
    '--gate-input-fg': 'var(--mm-gray-900)',
  },
  dark: {
    '--gate-fg': 'var(--mm-white)',
    '--gate-muted': 'rgba(var(--mm-white-rgb), 0.75)',
    '--gate-surface': 'rgba(var(--mm-white-rgb), 0.1)',
    '--gate-border': 'rgba(var(--mm-white-rgb), 0.2)',
    '--gate-input-bg': 'rgba(var(--mm-white-rgb), 0.9)',
    '--gate-input-fg': 'var(--mm-gray-900)',
  },
} as const;
