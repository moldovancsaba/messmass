// lib/contentSlots.ts
// WHAT: Content slot and presentation token registry
// WHY: Formally manage editorial content slots (reportImage1..N, reportText1..N, reportTable1..N, [MEDIA:*], [TEXT:*])
//      without polluting the event-collected KYC telemetry catalog (variables_metadata).
// HOW: Pure static definitions and resolver functions separating presentation slots from numeric KYC variables.

import type { ContentAsset } from './contentAssetTypes';

/**
 * Regex patterns for recognized presentation slots
 */
export const CONTENT_SLOT_PATTERNS = {
  reportImage: /^reportImage\d+$/,
  reportText: /^reportText\d+$/,
  reportTable: /^reportTable\d+$/,
  fanSelfie: /^fanSelfie[A-Za-z0-9_]+$/,
  cmsMedia: /^MEDIA:[a-zA-Z0-9_-]+$/,
  cmsText: /^TEXT:[a-zA-Z0-9_-]+$/,
  bracketedSlot: /^\[(reportImage\d+|reportText\d+|reportTable\d+|fanSelfie[A-Za-z0-9_]+|MEDIA:[a-zA-Z0-9_-]+|TEXT:[a-zA-Z0-9_-]+)\]$/
};

/**
 * Checks whether an unbracketed or bracketed identifier is a recognized content slot
 */
export function isContentSlot(identifier: string): boolean {
  if (!identifier || typeof identifier !== 'string') return false;
  const trimmed = identifier.trim();
  
  // Direct bracketed token
  if (CONTENT_SLOT_PATTERNS.bracketedSlot.test(trimmed)) return true;

  // Unbracketed token (strip leading stats. if present)
  const normalized = trimmed.startsWith('stats.') ? trimmed.substring(6) : trimmed;

  return (
    CONTENT_SLOT_PATTERNS.reportImage.test(normalized) ||
    CONTENT_SLOT_PATTERNS.reportText.test(normalized) ||
    CONTENT_SLOT_PATTERNS.reportTable.test(normalized) ||
    CONTENT_SLOT_PATTERNS.fanSelfie.test(normalized) ||
    CONTENT_SLOT_PATTERNS.cmsMedia.test(normalized) ||
    CONTENT_SLOT_PATTERNS.cmsText.test(normalized)
  );
}

/**
 * Strips brackets and 'stats.' prefix to get canonical slot key
 */
export function normalizeSlotIdentifier(identifier: string): string {
  let cleaned = identifier.trim();
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith('stats.')) {
    cleaned = cleaned.substring(6);
  }
  return cleaned;
}

/**
 * Resolves a content slot from stats or contentAssets
 */
export function resolveContentSlot(
  identifier: string,
  stats: Record<string, any> = {},
  contentAssets?: ContentAsset[]
): string | 'NA' {
  const slotKey = normalizeSlotIdentifier(identifier);

  // CMS Token Resolution: MEDIA:slug or TEXT:slug
  if (slotKey.startsWith('MEDIA:') || slotKey.startsWith('TEXT:')) {
    const [prefix, slug] = slotKey.split(':');
    const asset = contentAssets?.find(a => a.slug === slug);

    if (asset) {
      // Check linkedVariable on stats first (e.g., reportImage1 / reportText1)
      const linkedKey = (asset as any).linkedVariable;
      if (linkedKey && stats[linkedKey] !== undefined && stats[linkedKey] !== null && stats[linkedKey] !== '') {
        return String(stats[linkedKey]);
      }
      if (prefix === 'MEDIA' && asset.type === 'image' && asset.content?.url) {
        return asset.content.url;
      }
      if (prefix === 'TEXT' && asset.type === 'text' && asset.content?.text) {
        return asset.content.text;
      }
    }

    // Fallback for legacy report-image-N / report-text-N / report-table-N slugs
    const legacyMatch = slug?.match(/^report-(image|text|table)-(\d+)$/i);
    if (legacyMatch) {
      const kind = legacyMatch[1].toLowerCase();
      const idx = legacyMatch[2];
      const mappedKey =
        kind === 'image' ? `reportImage${idx}` :
        kind === 'text' ? `reportText${idx}` :
        `reportTable${idx}`;
      const mappedVal = stats[mappedKey];
      if (mappedVal !== undefined && mappedVal !== null && mappedVal !== '') {
        return String(mappedVal);
      }
    }

    return 'NA';
  }

  // Report Slots Resolution: reportImage1, reportText1, etc.
  const val = stats[slotKey];
  if (val !== undefined && val !== null && val !== '') {
    return String(val);
  }

  return 'NA';
}
