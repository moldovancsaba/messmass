// lib/theme/styleGuardian.ts
// WHAT: Automated Theme & Legibility Guardian (WCAG 2.1 AA & GDS#81)
// WHY: Prevent broken themes from producing illegible text, blind states, or monochromatic charts
// HOW: Pure mathematical color checks (luminance, contrast ratio, hue variance, palette generator)

import { normalizeHexColor } from '../reportStyleTypes';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parse an 8-character (#RRGGBBAA) or 6-character (#RRGGBB) hex color into sRGB 0..255 components.
 */
export function hexToRgb(hex: string): RgbColor {
  const clean = normalizeHexColor(hex).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1
  };
}

/**
 * Compute WCAG 2.1 relative luminance for an sRGB component.
 * Formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function sRgbLuminanceComponent(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Calculate WCAG 2.1 relative luminance (0..1) of a color.
 */
export function calculateLuminance(rgb: RgbColor): number {
  const r = sRgbLuminanceComponent(rgb.r);
  const g = sRgbLuminanceComponent(rgb.g);
  const b = sRgbLuminanceComponent(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Compute WCAG contrast ratio between two hex colors.
 * Returns a value between 1.0 (identical) and 21.0 (black vs white).
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateLuminance(hexToRgb(hex1));
  const lum2 = calculateLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Convert RGB to HSL to check hue variance.
 */
export function rgbToHsl(rgb: RgbColor): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Convert HSL to #RRGGBBAA hex string.
 */
export function hslToHex(h: number, s: number, l: number, a: number = 1): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`.toLowerCase();
}

/**
 * Generate a harmonious 5-tier categorical color ramp from a base hue.
 * Guarantees distinct colors for charts when custom themes configure identical bar colors.
 */
export function generateCategoricalBarPalette(primaryHex: string): [string, string, string, string, string] {
  const rgb = hexToRgb(primaryHex);
  const hsl = rgbToHsl(rgb);

  // Stepped hues around the color wheel with balanced saturation and lightness
  const hues = [
    hsl.h,
    (hsl.h + 50) % 360,
    (hsl.h + 160) % 360,
    (hsl.h + 210) % 360,
    (hsl.h + 290) % 360
  ];

  return hues.map((hue, index) => {
    // Keep lightness in readable 42%-55% band for crisp contrast on light cards
    const l = 0.44 + (index % 3) * 0.04;
    const s = Math.max(0.65, Math.min(0.88, hsl.s));
    return hslToHex(hue, s, l);
  }) as [string, string, string, string, string];
}

/**
 * Guard and sanitize any report style object before CSS injection.
 * Enforces WCAG AA contrast (≥ 4.5:1), resolves blind states (text == background),
 * prevents monochromatic bar tracks, and softens harsh saturated card borders.
 */
export function guardReportStyle<T extends Record<string, any>>(rawStyle: T): T {
  if (!rawStyle || typeof rawStyle !== 'object') return rawStyle;

  const style: Record<string, any> = { ...rawStyle };

  // 1. Guard PDF Export Button Contrast (WCAG AA: min 4.5:1)
  const exportBg = style.exportButtonBackground || style.heroBackground || '#00012eff';
  const exportText = style.exportButtonText || '#ffffffff';
  if (calculateContrastRatio(exportBg, exportText) < 4.5) {
    const bgLum = calculateLuminance(hexToRgb(exportBg));
    // If background is dark, use crisp white text; if light, use dark slate text
    style.exportButtonText = bgLum < 0.4 ? '#ffffffff' : '#0f172aff';
  }

  // 2. Guard Blind States (Invisible text on identical background: 1.0:1)
  const noDataBg = style.chartNoDataBackground || '#f1f5f9ff';
  const noDataText = style.chartNoDataText || '#475569ff';
  if (calculateContrastRatio(noDataBg, noDataText) < 3.0 || noDataBg.toLowerCase() === noDataText.toLowerCase()) {
    style.chartNoDataBackground = '#f8fafcff';
    style.chartNoDataBorder = '#cbd5e1ff';
    style.chartNoDataText = '#475569ff';
  }

  const errorBg = style.chartErrorBackground || '#fef2f2ff';
  const errorText = style.chartErrorText || '#dc2626ff';
  if (calculateContrastRatio(errorBg, errorText) < 3.0 || errorBg.toLowerCase() === errorText.toLowerCase()) {
    style.chartErrorBackground = '#fef2f2ff';
    style.chartErrorText = '#b91c1cff';
  }

  // 3. Guard Monochromatic Bar Series (Check if barColor1..5 are identical)
  const b1 = style.barColor1 ? normalizeHexColor(style.barColor1) : null;
  const b2 = style.barColor2 ? normalizeHexColor(style.barColor2) : null;
  const b3 = style.barColor3 ? normalizeHexColor(style.barColor3) : null;
  const b4 = style.barColor4 ? normalizeHexColor(style.barColor4) : null;
  const b5 = style.barColor5 ? normalizeHexColor(style.barColor5) : null;

  const colors = [b1, b2, b3, b4, b5].filter(Boolean) as string[];
  const allIdentical = colors.length >= 2 && colors.every(c => c === colors[0]);

  if (allIdentical && b1) {
    const [c1, c2, c3, c4, c5] = generateCategoricalBarPalette(b1);
    style.barColor1 = c1;
    style.barColor2 = c2;
    style.barColor3 = c3;
    style.barColor4 = c4;
    style.barColor5 = c5;
  }

  // 4. Soften Saturated Card Borders to Prevent Visual Cage Clutter
  if (style.chartBorder) {
    const borderRgb = hexToRgb(style.chartBorder);
    const borderLum = calculateLuminance(borderRgb);
    // If border is intensely dark or saturated, soften opacity to 18% so it frames cleanly
    if (borderLum < 0.3 || (borderRgb.r > 120 && borderRgb.b > 120)) {
      style.chartBorder = `rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, 0.18)`;
    }
  }

  return style as T;
}
