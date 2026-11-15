// lib/photoHashtags.ts
// WHAT: The hashtags stored on every photo Fanmass delivers (Camera photo results and SZRT drive photos).
// WHY: Owner 2026-11-14: Fanmass tags every photo with what it found (event, sport, brands read, emotions, people), and
//     Messmass records them. Messmass adds the hashtags of the event the photo sits in, so a photo carries "from the
//     event to the emotion" and any hashtag report finds it by its own hashtags.

export const MAX_PHOTO_HASHTAGS = 80;
const HASHTAG = /^[a-z0-9_]{1,60}$/;

/** One Messmass event hashtag as a photo hashtag: no #, accents folded, lower case, letters, digits and _ only. */
export function toPhotoHashtag(text: string): string {
  return text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 60);
}

/** The hashtags Fanmass sent with a photo; anything else than a clean hashtag is refused, not repaired. */
export function parsePhotoHashtags(value: unknown, fail: (message: string) => never): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_PHOTO_HASHTAGS) fail(`hashtags must list at most ${MAX_PHOTO_HASHTAGS} hashtags.`);
  const out = (value as unknown[]).map((v) => (typeof v === 'string' ? v.trim().replace(/^#/, '').toLowerCase() : ''));
  if (out.some((v) => !HASHTAG.test(v))) fail('hashtags must be letters, digits or _ (1 to 60).');
  return [...new Set(out)];
}

/** The hashtags of an event: the plain list (an array, or one comma-separated text) and every categorized one. */
export function eventHashtags(event: Record<string, unknown> | null | undefined): string[] {
  const raw: unknown[] = [];
  const plain = event?.hashtags;
  if (Array.isArray(plain)) raw.push(...plain);
  else if (typeof plain === 'string') raw.push(...plain.split(','));
  const categorized = event?.categorizedHashtags;
  if (categorized && typeof categorized === 'object') {
    for (const list of Object.values(categorized as Record<string, unknown>)) if (Array.isArray(list)) raw.push(...list);
  }
  return [...new Set(raw.filter((v): v is string => typeof v === 'string').map(toPhotoHashtag).filter(Boolean))];
}

/** The identity of a hashtag: its photo form without underscores. People type long names with underscores
 * (otp_bank_pick_szeged) and short ones without (ujpestfc); Fanmass writes names without (otpbankpickszeged). The
 * underscore is spelling only, so typed and automatic hashtags of the same name are the same hashtag. */
export const compactHashtag = (text: string): string => toPhotoHashtag(text.trim().replace(/^#/, '')).replace(/_/g, '');

/** Matches every spelling of a hashtag in the database: any case, a leading #, underscores anywhere. */
export function hashtagSpellings(text: string): RegExp {
  const letters = compactHashtag(text).split('');
  return new RegExp(`^#?${letters.join('_*')}$`, 'i');
}

/** The photo's own hashtags followed by its event's, once each (one spelling per hashtag: the event's typed one wins). */
export function withEventHashtags(photo: string[], event: string[]): string[] {
  const typed = new Set(event.map(compactHashtag));
  return [...new Set([...photo.filter((tag) => !typed.has(compactHashtag(tag))), ...event])];
}
