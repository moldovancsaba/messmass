// lib/pageAccess.ts
// WHAT: Server-side proof that a visitor passed a page-password check.
// WHY: Page passwords protected only the browser. On success the client wrote a
//     flag into sessionStorage and gated its own fetch on it, while the APIs
//     behind those pages had no authentication at all — audit finding F-001, which
//     was demonstrated by fetching 186 projects and 108 aggregated stat keys from a
//     password-protected filter with no credentials of any kind. Client-side state
//     cannot protect server-side data; only a credential the server issues and
//     verifies can.
// HOW: On a successful password check the server issues a signed, HttpOnly grant
//     cookie naming exactly the pages that were unlocked. Routes serving or
//     mutating a protected page's data require a matching grant. Signed with the
//     same JWT_SECRET as sessions, so there is one signing key to rotate, not two.
//     The event editor loader also issues a grant when it serves an editor with
//     no password to a caller holding its secret edit link, so saving follows
//     the same rule as loading (see withPageAccessGrant).

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { PageType } from './pagePassword';
import { getAdminUser } from './auth';
import { isUuidV4 } from './partnerIdentifier';

export const PAGE_ACCESS_COOKIE = 'page-access';

// WHAT: Grant lifetime, counted per grant from when it was last issued.
// WHY: The behaviour being replaced was sessionStorage, which dies with the tab.
//     12 hours is longer than that, because an operator running an event should
//     not be re-prompted mid-shift, and shorter than a session cookie, because a
//     page password is a shared secret handed to guests. The editor loaders
//     re-issue the grant each time an open editor re-fetches its page, so the 12
//     hours run from the last load, not from the password entry. Renewal never
//     outlives the password: setting or regenerating it ends every grant issued
//     before it (see currentPageGrants).
const GRANT_TTL_SECONDS = 12 * 60 * 60;

// WHAT: Cap on grants carried in one cookie.
// WHY: The cookie grows as a visitor unlocks more pages, and an oversized Cookie
//     header is rejected by proxies — which would present as an unexplained
//     logout. Oldest grants are dropped first.
const MAX_GRANTS = 40;

// WHAT: `issued` holds each grant's issue time (epoch seconds), index-aligned
//     with `grants`.
// WHY: Every grant lives in one signed token, so re-signing it for one page
//     used to restart the clock for every page in it. With editor loads now
//     re-issuing grants routinely, that would let any unrelated page keep a
//     password-protected page's grant alive indefinitely. Tracking issue time
//     per grant means renewing one page renews only that page. Stored as a
//     parallel number array rather than a key->time map so the cookie does not
//     carry every key twice (40 grants must still fit in one cookie).
interface GrantPayload {
  grants: string[];
  issued?: number[];
  // Indices into `grants` whose `issued` entry is not a real issue time (see
  // Grant.dated). Absent when every grant is dated, which is the normal case.
  undated?: number[];
  iat?: number;
}

interface Grant {
  key: string;
  issued: number;
  // WHAT: Whether `issued` is this grant's own issue time.
  // WHY: A token signed before per-grant times existed carries only its own
  //     iat, and that iat moves every time the token is re-signed for ANY
  //     page -- so it says nothing about when a given grant was issued. A
  //     grant dated that way could look newer than a password that was set to
  //     cut it off, and one renewal would then turn it into a genuinely fresh
  //     grant. Undated grants still expire from that fallback time, but on a
  //     protected page the editor gate and the write guards never count them
  //     as current (requirePageAccessDecision, currentPageGrants), so they are
  //     neither renewed nor used to save: their holders enter the password
  //     once more. The read-only report gate (requirePageAccess) still admits
  //     them until they run out.
  dated: boolean;
}

function grantKey(pageType: PageType | string, pageId: string): string {
  return `${pageType}:${pageId}`;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required to issue page access grants');
    }
    return 'dev-secret-change-in-production';
  }
  return s;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function readGrantSet(token: string | undefined): Grant[] {
  if (!token) return [];
  try {
    const decoded = jwt.verify(token, secret(), { algorithms: ['HS256'] }) as GrantPayload;
    if (!Array.isArray(decoded.grants)) return [];
    const issued = Array.isArray(decoded.issued) ? decoded.issued : [];
    const undated = new Set(Array.isArray(decoded.undated) ? decoded.undated : []);
    // Tokens signed before per-grant times existed carry only the token's own
    // iat, which is the latest any of their grants could have been issued. It
    // bounds how long they live, but does not date them (Grant.dated).
    // Missing both, fail closed: a grant with no time at all is not honoured.
    const fallback = typeof decoded.iat === 'number' ? decoded.iat : 0;
    const oldestValid = nowSeconds() - GRANT_TTL_SECONDS;
    const grants: Grant[] = [];
    decoded.grants.forEach((key, index) => {
      if (typeof key !== 'string') return;
      const own = typeof issued[index] === 'number' ? issued[index] : null;
      const at = own ?? fallback;
      if (at > oldestValid) grants.push({ key, issued: at, dated: own !== null && !undated.has(index) });
    });
    return grants;
  } catch {
    // Expired or tampered: treat as no grants rather than throwing, so a stale
    // cookie re-prompts for the password instead of erroring the page.
    return [];
  }
}

function readGrants(token: string | undefined): string[] {
  return readGrantSet(token).map((grant) => grant.key);
}

// WHAT: Add (or renew) one page in a visitor's grant set and re-sign it.
// WHY: A visitor legitimately unlocks several pages in a session; re-issuing a
//     single cookie keeps that in one credential instead of one cookie per page.
//     Only the named page gets a fresh issue time; every other grant keeps its
//     own, so it expires when it would have anyway. An undated grant carried
//     over from an older token stays undated: writing its fallback time into
//     `issued` as if it were its own would make it current on a protected page.
export function mintPageAccessToken(existing: string | undefined, pageType: PageType | string, pageId: string): string {
  const key = grantKey(pageType, pageId);
  const grants = readGrantSet(existing).filter((g) => g.key !== key);
  grants.push({ key, issued: nowSeconds(), dated: true });
  const kept = grants.slice(-MAX_GRANTS);
  const undated = kept.flatMap((g, index) => (g.dated ? [] : [index]));
  const payload: GrantPayload = { grants: kept.map((g) => g.key), issued: kept.map((g) => g.issued) };
  if (undated.length > 0) payload.undated = undated;
  return jwt.sign(payload as object, secret(), { algorithm: 'HS256', expiresIn: GRANT_TTL_SECONDS });
}

export function pageAccessCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: GRANT_TTL_SECONDS,
    path: '/' as const,
  };
}

// WHAT: Does this request carry a grant for the given page?
// WHY: The single question every protected route asks.
// NOTE: This checks the cookie only, not whether the page's password changed
//     after the grant was issued. The editor write guards, which renew grants
//     and so could otherwise keep one alive indefinitely, use
//     currentPageGrants below instead.
export async function hasPageAccess(pageType: PageType | string, pageId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(PAGE_ACCESS_COOKIE)?.value;
  return readGrants(token).includes(grantKey(pageType, pageId));
}

// WHAT: Does this request hold an edit grant for ANY page?
// WHY: A few routes are driven by the page-password editor but are not scoped to
//     one project -- POST /api/auto-generate-chart-block writes a global chart
//     configuration and takes no project id, yet ReportContentManager calls it
//     from inside EditorDashboard, which an event operator reaches by page
//     password -- or, for an editor with no password, by its edit link --
//     rather than an admin session. Requiring an admin session there would
//     break live editing at events; requiring nothing left it open to
//     anonymous callers. This is the middle answer: prove you opened *some*
//     editor, which is strictly more than the route asked for before.
// NOTE: Names no page, so it cannot check a grant against that page's current
//     password. A grant cut off by a new password still passes here until its
//     own 12 hours run out -- nothing renews it any more, because the loaders
//     renew only grants that currentPageGrants accepts.
export async function hasAnyEditGrant(): Promise<boolean> {
  const store = await cookies();
  const grants = readGrants(store.get(PAGE_ACCESS_COOKIE)?.value);
  return grants.some((g) => g.startsWith('edit:') || g.startsWith('partner-edit:'));
}

// WHAT: Is this page protected at all?
// WHY: Most pages have no password configured, and those must stay reachable.
//     Requiring a grant for an unprotected page would break every public report.
//     Checked against the same collection the password check writes to, so the
//     guard turns on the moment a password is set and off when it is removed.
export async function isPageProtected(pageType: PageType | string, pageId: string): Promise<boolean> {
  const { getDb } = await import('./fanmassIntegration');
  const db = await getDb();
  const found = await db.collection('page_passwords').findOne(
    { pageId, pageType },
    { projection: { _id: 1 } }
  );
  return found !== null;
}

// WHAT: A page_passwords createdAt as epoch seconds, rounded down.
// WHY: Grants carry whole seconds, so comparing at millisecond precision would
//     refuse a password entered in the same second the password was set. A row
//     without a readable createdAt gives 0, which cuts off nothing: refusing
//     every grant there would lock the page for good, because a grant issued
//     after re-entering the password could not be shown to be newer either.
//     getOrCreatePagePassword writes createdAt on create and on regenerate, so
//     every password an admin sets or rotates has one.
function passwordSetAtSeconds(createdAt: unknown): number {
  const ms =
    createdAt instanceof Date ? createdAt.getTime()
      : typeof createdAt === 'string' ? Date.parse(createdAt)
        : NaN;
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

// WHAT: When the newest password among these page identifiers was set (epoch
//     seconds), or null when none of them has a password.
// WHY: A grant must not outlive the password it stands for. Setting a password
//     on an open editor, or regenerating a leaked one, is how an admin takes
//     access away, and the editor loaders renew grants on every load -- so
//     without this check a holder who reloaded at least every 12 hours kept
//     access forever. The newest password across the aliases is used, so a
//     change to any of them cuts off grants for all of them. At worst that
//     re-prompts a holder of an older, still valid password; it never lets
//     anyone in.
async function newestPasswordAt(pageType: PageType | string, pageIds: string[]): Promise<number | null> {
  if (pageIds.length === 0) return null;
  const { getDb } = await import('./fanmassIntegration');
  const db = await getDb();
  const rows = await Promise.all(
    pageIds.map((pageId) =>
      db.collection('page_passwords').findOne(
        { pageId, pageType },
        { projection: { _id: 1, createdAt: 1 } }
      )
    )
  );
  let newest: number | null = null;
  for (const row of rows) {
    if (!row) continue;
    const at = passwordSetAtSeconds((row as { createdAt?: unknown }).createdAt);
    newest = newest === null ? at : Math.max(newest, at);
  }
  return newest;
}

function uniqueIds(pageIds: string[]): string[] {
  return Array.from(new Set(pageIds.filter((id) => typeof id === 'string' && id.length > 0)));
}

// WHAT: The grants this request carries for any of these pages, with their
//     issue times.
interface HeldGrant {
  pageId: string;
  issued: number;
  dated: boolean;
}

async function heldGrantsFor(pageType: PageType | string, pageIds: string[]): Promise<HeldGrant[]> {
  const store = await cookies();
  const grants = readGrantSet(store.get(PAGE_ACCESS_COOKIE)?.value);
  const held: HeldGrant[] = [];
  for (const pageId of pageIds) {
    const grant = grants.find((g) => g.key === grantKey(pageType, pageId));
    if (grant) held.push({ pageId, issued: grant.issued, dated: grant.dated });
  }
  return held;
}

// WHAT: Is this held grant current for a page whose newest password was set at
//     `passwordSetAt` (null: no password)?
// WHY: One rule for the write guards and the editor loaders, which renew what
//     they admit. With a password, the grant must be dated (Grant.dated) and
//     issued no earlier than it; a grant from a token older than per-grant
//     times cannot show that, so its holder enters the password once more
//     rather than having it renewed or saving with it.
// NOTE: `acceptUndated` is for requirePageAccess only: a read gate that never
//     renews and grants no write, where such a grant is judged by its fallback
//     time as before and simply runs out (see requirePageAccess).
function isCurrentGrant(grant: HeldGrant, passwordSetAt: number | null, acceptUndated = false): boolean {
  return passwordSetAt === null || ((grant.dated || acceptUndated) && grant.issued >= passwordSetAt);
}

// WHAT: Which of `grantIds` this request holds a current grant for. Current
//     means issued at or after the newest password on any of `aliasIds` (and
//     `grantIds`); with no password on any of them, every held grant counts.
// WHY: The write guards (requireProjectWrite, hasPartnerWriteGrant) accept a
//     grant with no other check, and the loaders renew what they accept. Both
//     must refuse a grant issued before the page's current password -- one
//     minted while the editor had no password, or before a regenerate -- or
//     changing the password would lock out nobody. The cookie is read first,
//     so a caller with no grant costs no database read.
export async function currentPageGrants(
  pageType: PageType | string,
  grantIds: string[],
  aliasIds: string[] = []
): Promise<string[]> {
  const held = await heldGrantsFor(pageType, uniqueIds(grantIds));
  if (held.length === 0) return [];
  const setAt = await newestPasswordAt(pageType, uniqueIds([...grantIds, ...aliasIds]));
  return held.filter((g) => isCurrentGrant(g, setAt)).map((g) => g.pageId);
}

export interface PageAccessDenial {
  response: NextResponse;
}

// WHAT: How a caller was let through a page gate, or the 401 to return.
// WHY: The editor loaders need more than yes/no. Whether they may issue a grant
//     depends on which rule passed: an unprotected page (open to whoever holds
//     the link), a grant the caller already holds (renew exactly that), or an
//     admin session (nothing to issue -- the session already authorises saves,
//     and a grant would outlive a sign-out on a shared event device).
export type PageAccessDecision =
  | { allowed: true; via: 'unprotected' }
  | { allowed: true; via: 'grant'; heldPageIds: string[] }
  | { allowed: true; via: 'admin' }
  | { allowed: false; response: NextResponse };

function pagePasswordRequired(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'This page is password protected.',
      code: 'PAGE_PASSWORD_REQUIRED',
    },
    { status: 401 }
  );
}

// WHAT: The page gate, evaluated across every identifier one page answers to.
// WHY: Three ways to pass, in cost order: no identifier of the page has a
//     password; the caller holds a grant for any of them that is newer than
//     the page's current password; the caller holds an admin session. A
//     password on any alias protects the page, so a page cannot be read around
//     its password through a different URL for the same thing. `heldPageIds`
//     lists only grants issued after the current password (see
//     currentPageGrants), so a loader that renews them never renews one the
//     password was set or regenerated to cut off.
export async function requirePageAccessDecision(
  pageType: PageType | string,
  pageIds: string[]
): Promise<PageAccessDecision> {
  return pageAccessDecision(pageType, pageIds, false);
}

async function pageAccessDecision(
  pageType: PageType | string,
  pageIds: string[],
  acceptUndated: boolean
): Promise<PageAccessDecision> {
  const ids = uniqueIds(pageIds);

  const passwordSetAt = await newestPasswordAt(pageType, ids);
  if (passwordSetAt === null) return { allowed: true, via: 'unprotected' };

  const heldPageIds = (await heldGrantsFor(pageType, ids))
    .filter((g) => isCurrentGrant(g, passwordSetAt, acceptUndated))
    .map((g) => g.pageId);
  if (heldPageIds.length > 0) return { allowed: true, via: 'grant', heldPageIds };

  if (await getAdminUser()) return { allowed: true, via: 'admin' };

  return { allowed: false, response: pagePasswordRequired() };
}

// WHAT: Guard for routes that serve or mutate a page's data.
// WHY: Returns null when the caller may proceed, or a 401 to return as-is. Three
//     ways to pass, in cost order: the page has no password; the caller holds a
//     grant for this page; the caller holds an admin session.
// NOTE: Returns 401 rather than 403 so the client can prompt for the password —
//     403 would read as "you may never see this", which is wrong for a page whose
//     whole model is "enter the password and you may".
// NOTE: Admits a grant from a token older than per-grant issue times, judged by
//     its fallback time (Grant.dated), unlike the editor gate. This gate serves
//     report data only: it never renews a grant and never authorises a write,
//     so such a grant just runs out within 12 hours. Refusing it would re-prompt
//     every report viewer once, and the report pages' own check
//     (hasPageAccess) would still let the page in around its data.
export async function requirePageAccess(
  pageType: PageType | string,
  pageId: string
): Promise<NextResponse | null> {
  const decision = await pageAccessDecision(pageType, [pageId], true);
  return decision.allowed ? null : decision.response;
}

// WHAT: May this event edit slug alone open an unprotected editor for write?
// WHY: An editor with no password is open to whoever holds its link, which is
//     only safe when the link cannot be guessed or found elsewhere. Event edit
//     slugs are minted as UUID v4, so they cannot be guessed. A project _id is
//     not a secret -- the public report APIs return it -- so it may not stand
//     in for a password (F-009).
// NOTE: Being a UUID is necessary, not sufficient. The edit slug of an editor
//     with no password is a write credential, so it must only be returned to
//     callers who may already write the event: the editor's own loader, admin
//     session routes and the fanmass integration. A read-only response that
//     includes it turns that read access into write access, which is why the
//     Bearer-key /api/public/* payloads leave it out
//     (tests/security/public-api-no-editslug.test.ts). Partner slugs are UUIDs too, but a
//     partner's edit slug is also its public report slug, so it is not a
//     secret and the partner loader never issues a grant from it.
export function isBearerSlug(value: string): boolean {
  return isUuidV4(value);
}

// WHAT: Attach a fresh grant for these pages to an outgoing response, merged
//     with every other grant the caller already holds.
// WHY: PUT /api/projects and PUT /api/partners authorise a non-admin save by a
//     grant alone, because they take only a database id, which is not a secret.
//     Grants used to come only from a password, so an event editor with NO
//     password loaded for anyone holding its edit link and then refused every
//     save -- an operator typed for hours into an editor that stored nothing.
//     The loaders call this once they have decided the caller may open the
//     editor: the event loader to issue a grant for an unprotected editor
//     opened by its secret edit link, both loaders to renew a grant the caller
//     already holds. Saving never follows a broader rule than loading. The
//     partner loader issues nothing for an unprotected editor, because its slug
//     is the partner's public report slug.
export async function withPageAccessGrant(
  response: NextResponse,
  pageType: PageType | string,
  pageIds: string[]
): Promise<NextResponse> {
  if (pageIds.length === 0) return response;
  const store = await cookies();
  let token = store.get(PAGE_ACCESS_COOKIE)?.value;
  for (const pageId of pageIds) {
    token = mintPageAccessToken(token, pageType, pageId);
  }
  if (token) response.cookies.set(PAGE_ACCESS_COOKIE, token, pageAccessCookieOptions());
  return response;
}
