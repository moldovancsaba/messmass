// lib/pagePassword.ts - Page-specific password generation and management

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { isUuidV4, resolvePartnerIdentifier } from './partnerIdentifier';

/**
 * Page password types and interfaces for {messmass} authentication system
 */

export type PageType =
  | 'event-report'
  | 'partner-report'
  | 'organization-report'
  | 'edit'
  | 'partner-edit'
  | 'organization-edit'
  | 'filter'
  | 'hashtag';

export interface PagePassword {
  _id?: string;
  pageId: string;           // Project slug, edit slug, or filter hash
  pageType: PageType;       // Type of page (stats, edit, filter)
  password: string;         // Generated MD5-style password
  createdAt: string;        // When password was generated
  expiresAt?: string;       // Optional expiration (null = never expires)
  usageCount: number;       // How many times password has been used
  lastUsedAt?: string;      // When password was last used
}

export interface ShareableLink {
  url: string;
  password: string;
  pageType: PageType;
  expiresAt?: string;
}

function parseVariantPageId(pageId: string): { basePageId: string; variantSlug: string | null } {
  const [basePageId, variantPart] = pageId.split('::variant=');
  return {
    basePageId,
    variantSlug: variantPart || null,
  };
}

function mapPagePasswordDocument(pagePassword: any): PagePassword {
  return {
    _id: pagePassword._id?.toString(),
    pageId: pagePassword.pageId,
    pageType: pagePassword.pageType,
    password: pagePassword.password,
    createdAt: pagePassword.createdAt,
    expiresAt: pagePassword.expiresAt,
    usageCount: pagePassword.usageCount,
    lastUsedAt: pagePassword.lastUsedAt,
  };
}

export async function resolveCanonicalPageId(db: any, pageId: string, pageType: PageType): Promise<string> {
  if (pageType !== 'partner-report' && pageType !== 'partner-edit') {
    return pageId;
  }

  const { basePageId, variantSlug } = parseVariantPageId(pageId);
  const resolved = await resolvePartnerIdentifier(db, basePageId);

  if (!resolved?.canonicalSlug) {
    return pageId;
  }

  return variantSlug
    ? `${resolved.canonicalSlug}::variant=${variantSlug}`
    : resolved.canonicalSlug;
}

/**
 * Generate a secure MD5-style password
 * Creates a password that looks like an MD5 hash but is randomly generated
 * 
 * @returns 32-character hexadecimal string (like MD5 hash)
 */
// WHAT: Cost factor for page-password hashing.
// WHY: Matches lib/users.ts so the codebase has one answer. 12 is the OWASP
//     floor; page passwords are 128-bit random tokens rather than human-chosen
//     secrets, so the hash defends against database disclosure, not guessing.
const PAGE_PASSWORD_SALT_ROUNDS = 12;

export async function hashPagePassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PAGE_PASSWORD_SALT_ROUNDS);
}

// WHAT: Compare a supplied password against the stored hash.
// WHY: bcrypt.compare is constant-time for a given hash, unlike the `===` this
//     replaces. A plaintext `password` field is treated as no credential at all:
//     every pre-existing password was retrievable by anonymous callers through
//     POST /api/page-passwords, so those values are burned and must be rotated
//     rather than migrated. Returning false here is what forces that.
export async function verifyPagePassword(
  doc: { passwordHash?: string | null },
  supplied: string
): Promise<boolean> {
  if (!doc?.passwordHash) return false;
  try {
    return await bcrypt.compare(supplied, doc.passwordHash);
  } catch {
    return false;
  }
}

export function generateMD5StylePassword(): string {
  // WHAT: Produce a 32-character lowercase hex string that "looks like" an MD5 hash.
  // WHY: Consumers expect an MD5-style token for page/admin one-time passwords.
  // Strategic choice: Use Node's crypto.randomBytes(16) -> 32 hex chars. This avoids Web Crypto
  // on the server and is sufficient since we only need a random token, not an MD5 digest of input.
  return randomBytes(16).toString('hex');
}

/**
 * Generate or retrieve password for a specific page
 * 
 * @param pageId - Unique identifier for the page (slug, etc.)
 * @param pageType - Type of page (stats, edit, filter)
 * @param regenerate - Force regeneration of existing password
 * @returns Promise<PagePassword>
 */
export async function getOrCreatePagePassword(
  pageId: string, 
  pageType: PageType, 
  regenerate: boolean = false
): Promise<PagePassword> {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');
    const canonicalPageId = await resolveCanonicalPageId(db as any, pageId, pageType);

    let existingPassword = await collection.findOne({ pageId: canonicalPageId, pageType });

    if (!existingPassword && canonicalPageId !== pageId) {
      const legacyPassword = await collection.findOne({ pageId, pageType });

      if (legacyPassword && !regenerate) {
        await collection.updateOne(
          { pageId: canonicalPageId, pageType },
          {
            $setOnInsert: {
              pageId: canonicalPageId,
              pageType,
              // Carry the hash, not the retired plaintext field. Copying
              // `password` here would migrate the record while dropping its
              // credential, silently invalidating a live share link.
              passwordHash: legacyPassword.passwordHash,
              createdAt: legacyPassword.createdAt,
              expiresAt: legacyPassword.expiresAt,
              usageCount: legacyPassword.usageCount || 0,
              lastUsedAt: legacyPassword.lastUsedAt,
            },
          },
          { upsert: true }
        );

        existingPassword = await collection.findOne({ pageId: canonicalPageId, pageType });
      }
    }

    if (existingPassword && !regenerate) {
      // The stored value is a hash, so there is no password to return. Callers
      // that need one for a share link must regenerate, which is a deliberate
      // trade: an irrecoverable password is the point.
      return { ...mapPagePasswordDocument(existingPassword), password: '' };
    }

    // WHAT: Generate, store only the hash, and hand the plaintext back once.
    // WHY: The plaintext is never persisted and cannot be re-read afterwards, so
    //     a later disclosure of the database — or of any endpoint that reads it —
    //     cannot reveal a working password. This is the property that was missing:
    //     passwords were stored in the clear and served to anonymous callers.
    const plaintext = generateMD5StylePassword();
    const passwordHash = await hashPagePassword(plaintext);

    await collection.updateOne(
      { pageId: canonicalPageId, pageType },
      {
        $set: {
          pageId: canonicalPageId,
          pageType,
          passwordHash,
          createdAt: new Date().toISOString(),
          usageCount: 0,
        },
        // Remove any pre-hash plaintext left on the document.
        $unset: { password: '' },
      },
      { upsert: true }
    );

    // WHAT: An event editor keeps one `edit` password: the one just set.
    //     Rows on its other address (the _id when this is the editSlug, or
    //     the other way round) are deleted.
    // WHY: A row left there was only overruled while it was older than this
    //     one. Once this one was removed it came back into force -- a password
    //     rotated away from someone let them in again, and write access with
    //     it -- while Share, which reads one address, called the editor
    //     unprotected and offered no way to remove it. Deleted after the new
    //     row is stored, so the editor is never without a password between the
    //     two writes.
    if (pageType === 'edit') {
      const others = (await eventEditAddresses(db, canonicalPageId)).filter((id) => id !== canonicalPageId);
      if (others.length > 0) {
        await collection.deleteMany({ pageType: 'edit', pageId: { $in: others } });
      }
    }

    const savedPassword = await collection.findOne({ pageId: canonicalPageId, pageType });
    return { ...mapPagePasswordDocument(savedPassword!), password: plaintext };

  } catch (error) {
    console.error('Failed to generate page password:', error);
    throw new Error('Failed to generate page password');
  }
}

// WHAT: A page_passwords createdAt as epoch milliseconds; 0 when unreadable.
// WHY: Same reading as lib/pageAccess.ts (passwordSetAtSeconds): a legacy row
//     without a createdAt counts as the oldest, never as the newest.
function passwordCreatedAtMs(createdAt: unknown): number {
  const ms =
    createdAt instanceof Date ? createdAt.getTime()
      : typeof createdAt === 'string' ? Date.parse(createdAt)
        : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

// WHAT: Every address one event editor answers to: the pageId given, plus the
//     event's _id and its editSlug when the pageId names an event.
// WHY: Edit shares were keyed `editSlug || _id`, so an event's `edit` password
//     can sit under either address, and the editor gate
//     (GET /api/projects/edit/[slug]) treats a password on any of them as
//     protecting the editor. Creating, regenerating, removing and reporting
//     an edit password all have to see the same set of addresses, or a
//     password the admin UI no longer shows keeps working.
// NOTE: The lookup mirrors findProjectByEditSlug: a 24-hex pageId is an _id,
//     a UUID is an editSlug. Anything else is the pageId alone.
async function eventEditAddresses(db: any, pageId: string): Promise<string[]> {
  const addresses = [pageId];
  const byId = /^[0-9a-f]{24}$/i.test(pageId);
  if (byId || isUuidV4(pageId)) {
    const project = await db.collection('projects').findOne(
      byId ? { _id: new ObjectId(pageId) } : { editSlug: pageId },
      { projection: { _id: 1, editSlug: 1 } }
    );
    if (project) {
      addresses.push(String(project._id));
      if (typeof project.editSlug === 'string' && project.editSlug) addresses.push(project.editSlug);
    }
  }
  return Array.from(new Set(addresses));
}

// WHAT: The `edit` password rows a password entered for this event editor is
//     checked against: of the rows stored under any address of the event --
//     the pageId it was entered on, the event's editSlug and its _id -- the
//     newest (several only when they tie, e.g. legacy rows with no createdAt).
// WHY: Edit shares were keyed `editSlug || _id`, so an older event's password
//     can sit on its _id while the editor is opened by its edit link, or the
//     other way round. The page gate (GET /api/projects/edit/[slug]) already
//     treats a password on any address as protecting the editor, but this
//     check looked only under the address the password was typed on, so an
//     operator holding the correct password was refused and could never get
//     in. Only the newest row counts because the gate measures grants against
//     the newest password on any address: regenerating the edit password
//     retires an older one left on the other address, instead of leaving it a
//     way back in with no way to remove it.
//     Since getOrCreatePagePassword and removePagePassword act on every
//     address, a second row only remains from before they did.
async function currentEventEditPasswords(db: any, pageId: string): Promise<any[]> {
  const collection = db.collection('page_passwords');
  const rows = (
    await Promise.all(
      (await eventEditAddresses(db, pageId)).map((id) => collection.findOne({ pageId: id, pageType: 'edit' }))
    )
  ).filter(Boolean);
  if (rows.length === 0) return [];
  const newest = Math.max(...rows.map((row: any) => passwordCreatedAtMs(row.createdAt)));
  return rows.filter((row: any) => passwordCreatedAtMs(row.createdAt) === newest);
}

/**
 * Validate page-specific password
 *
 * @param pageId - Page identifier
 * @param pageType - Type of page
 * @param providedPassword - Password provided by user
 * @returns Promise<boolean>
 */
export async function validatePagePassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    let pagePassword: any = null;
    let isValid = false;

    if (pageType === 'edit') {
      // An event editor answers to its editSlug and its _id (see
      // currentEventEditPasswords); the password may sit on either.
      for (const candidate of await currentEventEditPasswords(db, pageId)) {
        if (await verifyPagePassword(candidate as { passwordHash?: string }, providedPassword)) {
          pagePassword = candidate;
          isValid = true;
          break;
        }
      }
      if (!pagePassword) return false;
    } else {
      pagePassword = await collection.findOne({ pageId, pageType });

      if (!pagePassword) {
        const canonicalPageId = await resolveCanonicalPageId(db as any, pageId, pageType);
        if (canonicalPageId !== pageId) {
          pagePassword = await collection.findOne({ pageId: canonicalPageId, pageType });
        }
      }

      if (!pagePassword) {
        return false;
      }

      // Check if password matches (constant-time, hash-based)
      isValid = await verifyPagePassword(pagePassword as { passwordHash?: string }, providedPassword);
    }

    if (isValid) {
      // Update usage statistics
      await collection.updateOne(
        { pageId: pagePassword.pageId, pageType },
        { 
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date().toISOString() }
        }
      );
    }

    return isValid;

  } catch (error) {
    console.error('Failed to validate page password:', error);
    return false;
  }
}

// NOTE: Static admin password validation has been removed.
// Admin-session bypass is handled at the API route level (see /api/page-passwords PUT).

/**
 * Validate access using the page-specific password path.
 * 
 * @param pageId - Page identifier
 * @param pageType - Type of page
 * @param providedPassword - Password provided by user
 * @returns Promise<{ isValid: boolean, isAdmin: boolean }>
 */
export async function validateAnyPassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<{ isValid: boolean, isAdmin: boolean }> {
  // WHAT: Validate provided password against the page-specific password only.
  // WHY: Legacy static admin password has been removed. Admin access is validated via session
  //      earlier in the API route (admin session bypass). This prevents secret drift and centralizes
  //      admin auth in the DB-backed session system.
  const isPagePasswordValid = await validatePagePassword(pageId, pageType, providedPassword);
  return { isValid: isPagePasswordValid, isAdmin: false };
}

/**
 * Generate shareable link with password for a page
 * 
 * @param pageId - Page identifier
 * @param pageType - Type of page
 * @param baseUrl - Base URL for the application
 * @returns Promise<ShareableLink>
 */
// WHAT: Pure URL construction for a page's public link, given its (already
//     canonicalized) pageId. WHY: extracted out of generateShareableLink so
//     the read-only status check below can build the same URL without
//     going anywhere near password creation.
export function buildShareableUrl(pageType: PageType, canonicalPageId: string, baseUrl: string = ''): string {
  const { basePageId, variantSlug } = parseVariantPageId(canonicalPageId);
  const rawPageId = canonicalPageId; // 'edit' uses the id as-is, no variant parsing

  let url = baseUrl;
  switch (pageType) {
    case 'event-report':
      // WHAT: Project/event report pages at /report/[slug]
      // WHY: Public shareable event statistics pages
      url += `/report/${canonicalPageId}`;
      break;
    case 'partner-report':
      // WHAT: Partner report pages at /partner-report/[slug]
      // WHY: Public shareable partner profile pages with event listings
      url += `/partner-report/${basePageId}`;
      if (variantSlug) {
        url += `?variant=${encodeURIComponent(variantSlug)}`;
      }
      break;
    case 'organization-report':
      // WHAT: Organization report pages at /organization-report/[id]
      // WHY: Shareable aggregated organization reporting pages
      url += `/organization-report/${basePageId}`;
      if (variantSlug) {
        url += `?variant=${encodeURIComponent(variantSlug)}`;
      }
      break;
    case 'edit':
      url += `/edit/${rawPageId}`;
      break;
    case 'partner-edit':
      // WHAT: Partner content editing pages at /partner-edit/[slug]
      // WHY: Allow editing partner-level text and image content
      url += `/partner-edit/${basePageId}`;
      if (variantSlug) {
        url += `?variant=${encodeURIComponent(variantSlug)}`;
      }
      break;
    case 'organization-edit':
      // WHAT: Organization content editing pages at /organization-edit/[id]
      // WHY: Allow editing organization-level report content and visibility settings
      url += `/organization-edit/${basePageId}`;
      if (variantSlug) {
        url += `?variant=${encodeURIComponent(variantSlug)}`;
      }
      break;
    case 'filter':
      url += `/filter/${basePageId}`;
      if (variantSlug) {
        url += `?variant=${encodeURIComponent(variantSlug)}`;
      }
      break;
    case 'hashtag':
      url += `/hashtag/${basePageId}`;
      if (variantSlug) {
        url += `?variant=${encodeURIComponent(variantSlug)}`;
      }
      break;
  }

  return url;
}

export async function generateShareableLink(
  pageId: string,
  pageType: PageType,
  baseUrl: string = ''
): Promise<ShareableLink> {
  const pagePassword = await getOrCreatePagePassword(pageId, pageType);
  const url = buildShareableUrl(pageType, pagePassword.pageId, baseUrl);

  return {
    url,
    password: pagePassword.password,
    pageType,
    expiresAt: pagePassword.expiresAt
  };
}

// WHAT: Read-only status check -- the public URL and whether a password
//     currently protects it -- with zero side effects.
// WHY: getOrCreatePagePassword always mints a password for an unprotected
//     page the moment it's called (by design, for the "generate password"
//     flow), so it can't back a "what's the current state?" check. Opening
//     the Share dialog used to call it anyway, silently password-protecting
//     every previously-public page it was ever opened on.
export async function getShareableLinkStatus(
  pageId: string,
  pageType: PageType,
  baseUrl: string = ''
): Promise<{ url: string; isProtected: boolean }> {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const collection = db.collection('page_passwords');
  const canonicalPageId = await resolveCanonicalPageId(db as any, pageId, pageType);

  // An event editor is protected by a password on any of its addresses, as
  // the editor gate sees it (see eventEditAddresses).
  const addresses =
    pageType === 'edit'
      ? await eventEditAddresses(db, canonicalPageId)
      : Array.from(new Set([canonicalPageId, pageId]));
  const matches = await Promise.all(
    addresses.map((id) => collection.findOne({ pageId: id, pageType }, { projection: { _id: 1 } }))
  );

  return {
    url: buildShareableUrl(pageType, canonicalPageId, baseUrl),
    isProtected: matches.some((match) => match !== null),
  };
}

// WHAT: Removes password protection from a page entirely (both the
//     canonical and any legacy-keyed record; for an event editor, the rows on
//     every address it answers to).
// WHY: There was no way to undo a password once SharePopup minted one --
//     the only path back to "public" was a direct database delete. An event
//     editor's older password left on its other address came back into force
//     when only the row at the given address was removed (see
//     eventEditAddresses).
export async function removePagePassword(pageId: string, pageType: PageType): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const collection = db.collection('page_passwords');
  const canonicalPageId = await resolveCanonicalPageId(db as any, pageId, pageType);

  const idsToRemove =
    pageType === 'edit'
      ? await eventEditAddresses(db, canonicalPageId)
      : Array.from(new Set([pageId, canonicalPageId]));
  const result = await collection.deleteMany({ pageType, pageId: { $in: idsToRemove } });
  return result.deletedCount > 0;
}

/**
 * Clean up expired passwords
 * Should be called periodically to maintain database cleanliness
 * 
 * @returns Promise<number> - Number of passwords cleaned up
 */
export async function cleanupExpiredPasswords(): Promise<number> {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    const now = new Date().toISOString();
    const result = await collection.deleteMany({
      expiresAt: { $exists: true, $lt: now }
    });

    return result.deletedCount;

  } catch (error) {
    console.error('Failed to cleanup expired passwords:', error);
    return 0;
  }
}

/**
 * Get page password statistics
 * Useful for admin monitoring
 * 
 * @param pageId - Optional page ID to get stats for specific page
 * @returns Promise<object>
 */
export async function getPasswordStats(pageId?: string) {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    const filter = pageId ? { pageId } : {};
    
    const total = await collection.countDocuments(filter);
    const used = await collection.countDocuments({ ...filter, usageCount: { $gt: 0 } });
    const neverUsed = total - used;

    const mostUsed = await collection.findOne(
      filter,
      { sort: { usageCount: -1 } }
    );

    return {
      total,
      used,
      neverUsed,
      mostUsed: mostUsed ? {
        pageId: mostUsed.pageId,
        pageType: mostUsed.pageType,
        usageCount: mostUsed.usageCount,
        lastUsedAt: mostUsed.lastUsedAt
      } : null
    };

  } catch (error) {
    console.error('Failed to get password stats:', error);
    return { total: 0, used: 0, neverUsed: 0, mostUsed: null };
  }
}
