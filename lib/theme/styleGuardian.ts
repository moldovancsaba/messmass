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
 * Generate a cohesive 5-tier tonal/analogous brand color ramp from a base hue.
 * Guarantees 5 distinct, harmonious shades without rainbow hue clashes.
 */
export function generateCategoricalBarPalette(primaryHex: string): [string, string, string, string, string] {
  const rgb = hexToRgb(primaryHex);
  const hsl = rgbToHsl(rgb);

  // Subtle analogous progression (+0..+24 deg) with stepped lightness (38% -> 62%)
  // Produces an executive monochromatic/analogous gradient instead of a jarring rainbow
  const steps = [
    { hOffset: 0, sScale: 1.0, l: 0.40 },
    { hOffset: 6, sScale: 0.92, l: 0.46 },
    { hOffset: 12, sScale: 0.85, l: 0.52 },
    { hOffset: 18, sScale: 0.78, l: 0.58 },
    { hOffset: 24, sScale: 0.70, l: 0.64 },
  ];

  const baseSat = Math.max(0.50, Math.min(0.82, hsl.s || 0.68));
  return steps.map((step) => {
    const hue = (hsl.h + step.hOffset) % 360;
    const sat = Math.max(0.35, Math.min(0.85, baseSat * step.sScale));
    return hslToHex(hue, sat, step.l);
  }) as [string, string, string, string, string];
}

/**
 * Compute maximum angular distance (0..180) between any two hues in an array.
 */
function maxHueSpread(hexColors: string[]): number {
  const hues = hexColors
    .map(c => rgbToHsl(hexToRgb(c)))
    .filter(hsl => hsl.s > 0.15)
    .map(hsl => hsl.h);
  if (hues.length < 2) return 0;
  let maxDist = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.abs(hues[i] - hues[j]) % 360;
      const angular = diff > 180 ? 360 - diff : diff;
      if (angular > maxDist) maxDist = angular;
    }
  }
  return maxDist;
}

/**
 * Guard and sanitize any report style object before CSS injection.
 * Enforces WCAG AA contrast (≥ 4.5:1), resolves blind states (text == background),
 * enforces a strict 3-tier neutral ink hierarchy (preventing magenta/neon card titles),
 * replaces rainbow bar series with cohesive tonal brand ramps, and softens card borders.
 */
export function guardReportStyle<T extends Record<string, any>>(rawStyle: T): T {
  if (!rawStyle || typeof rawStyle !== 'object') return rawStyle;

  const style: Record<string, any> = { ...rawStyle };

  // 0. Determine Page, Hero & Card Surface Polarity
  const heroBg = style.heroBackground || '#ffffffff';
  const rawPageBg = style.pageBackground || '#f8fafcff';
  const rawCardBg = style.chartBackground || '#ffffffff';
  const isDarkHero = calculateLuminance(hexToRgb(heroBg)) < 0.35;
  const isDarkPage = calculateLuminance(hexToRgb(rawPageBg)) < 0.25;

  // Identify a reliable brand accent color (non-white, non-near-white) for fallback use on light cards
  const brandCandidates = [
    rawStyle.heroBackground,
    rawStyle.chartBackground,
    rawStyle.exportButtonBackground,
    rawStyle.barColor1,
    rawStyle.pieColor1,
    rawStyle.kpiIconColor,
  ].filter((c): c is string => typeof c === 'string' && c.startsWith('#'));
  const brandSeed =
    brandCandidates.find((c) => {
      const lum = calculateLuminance(hexToRgb(c));
      return lum > 0.02 && lum < 0.72;
    }) || '#2563ebff';

  // Normalize light-mode page & card surfaces so chromatic/muddy card slabs become clean editorial white cards
  if (!isDarkPage) {
    if (calculateLuminance(hexToRgb(rawPageBg)) > 0.98) {
      style.pageBackground = '#f8fafcff';
    }
    const cardRgb = hexToRgb(rawCardBg);
    const cardLum = calculateLuminance(cardRgb);
    const cardHsl = rgbToHsl(cardRgb);
    if (cardLum < 0.92 || cardHsl.s > 0.12) {
      style.chartBackground = '#ffffffff';
    }
  }

  const pageBg = style.pageBackground || rawPageBg;
  const cardBg = style.chartBackground || rawCardBg;
  const isDarkCard = calculateLuminance(hexToRgb(cardBg)) < 0.25;

  // 1. Guard PDF Export Button Contrast (WCAG AA: min 4.5:1)
  const exportBg = style.exportButtonBackground || style.heroBackground || '#00012eff';
  const exportText = style.exportButtonText || '#ffffffff';
  if (calculateContrastRatio(exportBg, exportText) < 4.5) {
    const bgLum = calculateLuminance(hexToRgb(exportBg));
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

  // 3. Enforce Neutral Editorial Ink Hierarchy (No Magenta/Chromatic Card Titles!)
  if (style.blockTitleColor) {
    const hsl = rgbToHsl(hexToRgb(style.blockTitleColor));
    if (hsl.s > 0.35 || calculateContrastRatio(pageBg, style.blockTitleColor) < 4.5) {
      style.blockTitleColor = isDarkPage ? '#f8fafcff' : '#0f172aff';
    }
  } else {
    style.blockTitleColor = isDarkPage ? '#f8fafcff' : '#0f172aff';
  }

  if (style.headingColor) {
    const hsl = rgbToHsl(hexToRgb(style.headingColor));
    if (hsl.s > 0.35 || calculateContrastRatio(heroBg, style.headingColor) < 4.5) {
      style.headingColor = isDarkHero ? '#f8fafcff' : '#0f172aff';
    }
  } else if (style.heroBackground) {
    style.headingColor = isDarkHero ? '#f8fafcff' : '#0f172aff';
  }

  if (style.subtitleColor) {
    if (calculateContrastRatio(heroBg, style.subtitleColor) < 3.5) {
      style.subtitleColor = isDarkHero ? '#cbd5e1ff' : '#475569ff';
    }
  }

  if (style.chartTitleColor) {
    const hsl = rgbToHsl(hexToRgb(style.chartTitleColor));
    // Never allow saturated chromatic colors (e.g. #99248d magenta) on card headers
    if (hsl.s > 0.22 || calculateContrastRatio(cardBg, style.chartTitleColor) < 4.5) {
      style.chartTitleColor = isDarkCard ? '#cbd5e1ff' : '#334155ff';
    }
  } else {
    style.chartTitleColor = isDarkCard ? '#cbd5e1ff' : '#334155ff';
  }

  if (style.chartValueColor) {
    const hsl = rgbToHsl(hexToRgb(style.chartValueColor));
    if (hsl.s > 0.25 || calculateContrastRatio(cardBg, style.chartValueColor) < 6.0) {
      style.chartValueColor = isDarkCard ? '#f8fafcff' : '#0f172aff';
    }
  } else {
    style.chartValueColor = isDarkCard ? '#f8fafcff' : '#0f172aff';
  }

  if (style.chartLabelColor) {
    const hsl = rgbToHsl(hexToRgb(style.chartLabelColor));
    if (hsl.s > 0.22 || calculateContrastRatio(cardBg, style.chartLabelColor) < 4.5) {
      style.chartLabelColor = isDarkCard ? '#94a3b8ff' : '#475569ff';
    }
  } else {
    style.chartLabelColor = isDarkCard ? '#94a3b8ff' : '#475569ff';
  }

  if (style.textColor) {
    if (calculateContrastRatio(cardBg, style.textColor) < 4.5) {
      style.textColor = isDarkCard ? '#e2e8f0ff' : '#1e293bff';
    }
  }

  // 3b. Guard KPI Icon, Pie Slices & Bar Seed Against White-on-White Invisible Accents on Light Cards
  if (!isDarkCard) {
    if (style.kpiIconColor && calculateLuminance(hexToRgb(style.kpiIconColor)) > 0.78) {
      style.kpiIconColor = brandSeed;
    }
    if (style.barColor1 && calculateLuminance(hexToRgb(style.barColor1)) > 0.78) {
      style.barColor1 = brandSeed;
    }
    if (style.pieColor1 && calculateLuminance(hexToRgb(style.pieColor1)) > 0.78) {
      style.pieColor1 = brandSeed;
    }
    if (style.pieColor2) {
      const p2Lum = calculateLuminance(hexToRgb(style.pieColor2));
      const p1Hex = normalizeHexColor(style.pieColor1 || brandSeed);
      const p2Hex = normalizeHexColor(style.pieColor2);
      if (p2Lum > 0.80 || p1Hex === p2Hex) {
        const p1Hsl = rgbToHsl(hexToRgb(p1Hex));
        style.pieColor2 =
          p1Hsl.s > 0.15
            ? hslToHex((p1Hsl.h + 24) % 360, Math.max(0.38, p1Hsl.s * 0.72), 0.64)
            : '#94a3b8ff';
      }
    }
  }

  // 4. Guard Bar Series: Replace Monochromatic OR Clashing Rainbow Bars with Tonal Brand Ramp
  const b1 = style.barColor1 ? normalizeHexColor(style.barColor1) : null;
  const b2 = style.barColor2 ? normalizeHexColor(style.barColor2) : null;
  const b3 = style.barColor3 ? normalizeHexColor(style.barColor3) : null;
  const b4 = style.barColor4 ? normalizeHexColor(style.barColor4) : null;
  const b5 = style.barColor5 ? normalizeHexColor(style.barColor5) : null;

  const colors = [b1, b2, b3, b4, b5].filter(Boolean) as string[];
  const allIdentical = colors.length >= 2 && colors.every(c => c === colors[0]);
  const isRainbowClash = colors.length >= 3 && maxHueSpread(colors) > 75;
  const hasWhiteBarOnLightCard = !isDarkCard && colors.some(c => calculateLuminance(hexToRgb(c)) > 0.80);

  if ((allIdentical || isRainbowClash || hasWhiteBarOnLightCard) && b1) {
    const seedHex = b1;
    const [c1, c2, c3, c4, c5] = generateCategoricalBarPalette(seedHex);
    style.barColor1 = c1;
    style.barColor2 = c2;
    style.barColor3 = c3;
    style.barColor4 = c4;
    style.barColor5 = c5;
  }

  // 5. Enforce Clean Donut Slice Separator Border (Match Card Background — Never Magenta!)
  style.pieBorderColor = normalizeHexColor(cardBg);

  // 6. Soften Saturated Card Borders to Prevent Visual Cage Clutter
  if (style.chartBorder && typeof style.chartBorder === 'string') {
    if (style.chartBorder.startsWith('#')) {
      const borderRgb = hexToRgb(style.chartBorder);
      const borderLum = calculateLuminance(borderRgb);
      const borderHsl = rgbToHsl(borderRgb);
      if (borderLum < 0.3 || borderHsl.s > 0.15) {
        style.chartBorder = isDarkCard
          ? 'rgba(255, 255, 255, 0.10)'
          : 'rgba(15, 23, 42, 0.08)';
      }
    } else if (!isDarkCard && style.chartBorder.includes('255, 255, 255')) {
      style.chartBorder = 'rgba(15, 23, 42, 0.08)';
    }
  }

  return style as T;
}
