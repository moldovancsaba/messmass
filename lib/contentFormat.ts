/**
 * WHAT: Normalise user-facing content for display (coding-standards: no em dashes).
 * WHY: Report/event text may contain em dashes; we show " - " instead.
 * HOW: Replace U+2014 (—) with " - " so all displayed copy follows the rule.
 */
export function replaceEmDashes(value: string | undefined | null): string {
  if (value == null || typeof value !== 'string') return '';
  return value.replace(/\u2014/g, ' - ');
}
