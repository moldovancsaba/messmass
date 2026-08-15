// lib/formatChartValue.ts
// WHAT: The single implementation of how a chart value is turned into display text.
// WHY: There were two. `lib/chartCalculator.ts` (admin builder) used
//     `toLocaleString`, and `app/report/[slug]/ReportChart.tsx` (published report)
//     used `toFixed`. Both read the same `formatting` object and agreed on
//     decimals, so they differed only in thousands separators — which meant an
//     author composed a report showing €1,500,000 and the partner who opened the
//     link saw €1500000. Anything below a thousand matched, which is why it went
//     unnoticed. Two implementations of one rule will always drift; this is one.
// HOW: Separators are kept, because the builder's rendering is what the author
//     reviewed and approved, and because these numbers are read by sponsors at a
//     glance. `tests/format-chart-value.test.ts` pins the behaviour.

export interface ChartValueFormatting {
  /** true → whole numbers, false → two decimals. Undefined behaves as true. */
  rounded?: boolean;
  prefix?: string;
  suffix?: string;
}

// WHAT: Decimal places implied by the formatting object.
// WHY: Both former implementations derived this identically; keeping it as one
//     named function means a future change to the rule cannot apply to only one
//     surface.
export function decimalsFor(formatting?: ChartValueFormatting): number {
  if (!formatting || formatting.rounded === undefined) return 0;
  return formatting.rounded ? 0 : 2;
}

// WHAT: Format a computed chart value for display.
// WHY: `'NA'` and plain strings pass through untouched — the formula engine
//     returns 'NA' for unevaluable formulas and raw strings for text elements,
//     and neither is a number to be localised.
export function formatChartValue(
  value: number | string | undefined | null,
  formatting?: ChartValueFormatting
): string {
  if (value === undefined || value === null || value === 'NA') return 'NA';
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return 'NA';

  const decimals = decimalsFor(formatting);
  const numeric = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const prefix = formatting?.prefix ?? '';
  const suffix = formatting?.suffix ?? '';
  return `${prefix}${numeric}${suffix}`;
}
