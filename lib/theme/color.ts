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
