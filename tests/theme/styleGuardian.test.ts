// tests/theme/styleGuardian.test.ts
import {
  hexToRgb,
  calculateLuminance,
  calculateContrastRatio,
  generateCategoricalBarPalette,
  guardReportStyle
} from '@/lib/theme/styleGuardian';

describe('styleGuardian', () => {
  test('calculates correct luminance and contrast ratio for pure black and white', () => {
    const white = hexToRgb('#ffffffff');
    const black = hexToRgb('#000000ff');

    expect(calculateLuminance(white)).toBeCloseTo(1.0, 2);
    expect(calculateLuminance(black)).toBeCloseTo(0.0, 2);

    const contrast = calculateContrastRatio('#ffffff', '#000000');
    expect(contrast).toBeCloseTo(21.0, 1);
  });

  test('detects WCAG AA failure on navy background with magenta text and corrects it', () => {
    const rawStyle = {
      exportButtonBackground: '#00012eff',
      exportButtonText: '#99248dff', // 2.81:1 contrast
    };

    const guarded = guardReportStyle(rawStyle);
    expect(guarded.exportButtonText).toBe('#ffffffff');

    const newContrast = calculateContrastRatio(guarded.exportButtonBackground, guarded.exportButtonText);
    expect(newContrast).toBeGreaterThanOrEqual(4.5);
  });

  test('resolves blind states where error/empty text matches background', () => {
    const rawStyle = {
      chartNoDataBackground: '#99248dff',
      chartNoDataText: '#99248dff', // 1.0:1 invisible
      chartErrorBackground: '#99248dff',
      chartErrorText: '#99248dff',
    };

    const guarded = guardReportStyle(rawStyle);
    expect(guarded.chartNoDataText).not.toBe(guarded.chartNoDataBackground);
    expect(guarded.chartErrorText).not.toBe(guarded.chartErrorBackground);

    const noDataContrast = calculateContrastRatio(guarded.chartNoDataBackground, guarded.chartNoDataText);
    expect(noDataContrast).toBeGreaterThanOrEqual(3.0);
  });

  test('generates 5 distinct categorical bar colors when all 5 are identical', () => {
    const rawStyle = {
      barColor1: '#1b92d1ff',
      barColor2: '#1b92d1ff',
      barColor3: '#1b92d1ff',
      barColor4: '#1b92d1ff',
      barColor5: '#1b92d1ff',
    };

    const guarded = guardReportStyle(rawStyle);
    const uniqueColors = new Set([
      guarded.barColor1,
      guarded.barColor2,
      guarded.barColor3,
      guarded.barColor4,
      guarded.barColor5,
    ]);

    expect(uniqueColors.size).toBe(5);
  });

  test('softens harsh saturated card borders to subtle neutral hairline borders', () => {
    const rawStyle = {
      chartBorder: '#99248dff',
      chartTitleColor: '#99248dff',
      pieBorderColor: '#99248dff',
      chartBackground: '#ffffffff',
    };

    const guarded = guardReportStyle(rawStyle);
    expect(guarded.chartBorder).toBe('rgba(15, 23, 42, 0.08)');
    expect(guarded.chartTitleColor).toBe('#334155ff');
    expect(guarded.pieBorderColor).toBe('#ffffffff');
  });

  test('replaces clashing 5-color rainbow bar palettes with a cohesive tonal brand ramp', () => {
    const rawStyle = {
      barColor1: '#2563ebff', // blue
      barColor2: '#8b5cf6ff', // purple
      barColor3: '#ef4444ff', // red
      barColor4: '#f59e0bff', // amber
      barColor5: '#10b981ff', // emerald
    };

    const guarded = guardReportStyle(rawStyle);
    expect(guarded.barColor3).not.toBe('#ef4444ff');
    expect(guarded.barColor4).not.toBe('#f59e0bff');
  });

  test('guards headingColor against heroBackground and normalizes heavy chromatic card slabs on light pages', () => {
    const rawStyle = {
      heroBackground: '#8e191cff',
      pageBackground: '#f8fafcff',
      chartBackground: '#8e191cff',
      headingColor: '#0f172aff',
      kpiIconColor: '#ffffffff',
      pieColor1: '#dcac6dff',
      pieColor2: '#ffffffff',
      barColor1: '#ffffffff',
    };

    const guarded = guardReportStyle(rawStyle);
    expect(guarded.headingColor).toBe('#f8fafcff');
    expect(guarded.chartBackground).toBe('#ffffffff');
    expect(guarded.kpiIconColor).toBe('#8e191cff');
    expect(guarded.pieColor2).not.toBe('#ffffffff');
  });
});
