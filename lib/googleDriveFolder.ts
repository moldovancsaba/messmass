// lib/googleDriveFolder.ts
// WHAT: Single source of truth for extracting a Google Drive folder ID from
//       whatever an admin pastes into the Drive Folders editor.
// WHY: Both the client component (instant feedback while typing) and the API
//      route (server-side re-validation, never trust the client alone) need
//      byte-identical parsing logic. Pure function, no side effects.

// Matches:
//   https://drive.google.com/drive/folders/<id>
//   https://drive.google.com/drive/folders/<id>?usp=sharing
//   https://drive.google.com/drive/u/0/folders/<id>
//   https://drive.google.com/open?id=<id>
//   https://drive.google.com/drive/folders/<id>/edit... (trailing path segments)
//   a bare pasted folder ID (no slashes/spaces, plausible length)
const FOLDER_PATH_RE = /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/;
const OPEN_ID_RE = /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/;
const BARE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

/**
 * Extracts a Google Drive folder ID from a pasted URL or bare ID.
 * Returns null if the input doesn't look like a Drive folder reference.
 */
export function extractDriveFolderId(input: string): string | null {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;

  const pathMatch = trimmed.match(FOLDER_PATH_RE);
  if (pathMatch) return pathMatch[1];

  const openMatch = trimmed.match(OPEN_ID_RE);
  if (openMatch) return openMatch[1];

  // Bare ID: only accept if it doesn't look like a URL/path at all (no slashes,
  // no dots that would indicate a hostname, no whitespace).
  if (BARE_ID_RE.test(trimmed) && !trimmed.includes('.') && !trimmed.includes('/')) {
    return trimmed;
  }

  return null;
}

/**
 * Builds a canonical, shareable Drive folder URL from a folder ID.
 * Used to normalize what's stored/displayed regardless of how the admin
 * originally pasted it (bare ID vs. any of the URL variants above).
 */
export function buildDriveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
