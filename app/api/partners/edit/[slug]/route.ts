// WHAT: API endpoint to fetch partner data for editing (partner-level content only)
// WHY: Enable partner-level editing of text and image content while keeping math data from events

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { error as logError } from '@/lib/logger';
import { listReportVariants, resolveReportVariant, updateReportVariant } from '@/lib/reportVariants';
import { findPartnerByIdentifier } from '@/lib/partnerIdentifier';
import { getAdminUser } from '@/lib/auth';
import { hasPartnerWriteGrant, partnerEditAccessRequired } from '@/lib/apiGuards';
import { parseStatsFieldChanges, parseEditorSequence } from '@/lib/statsFieldChanges';
import {
  currentPageGrants,
  requirePageAccessDecision,
  withPageAccessGrant,
  type PageAccessDecision,
} from '@/lib/pageAccess';

type EditablePartner = {
  _id: { toString(): string };
  viewSlug?: unknown;
  legacyViewSlugs?: unknown;
};

// WHAT: Every partner-edit page key this request's editor answers to: all of
//     the partner's identifiers, plus each of them composed with the
//     `?variant=` value when one is present.
// WHY: The page mints its grant under the URL it was opened with
//     (PartnerEditClient passes `<slug>` or `<slug>::variant=<v>`, pageType
//     'partner-edit', where <slug> is the canonical slug: the viewSlug, or the
//     _id when there is none) -- but PartnerEditorDashboard then PUTs by raw
//     `_id`, so a single-key check would 401 a legitimate password-holder
//     saving, and a password keyed by viewSlug would silently not protect the
//     `_id`-form URL at all. The page gate and the variant write check both
//     read this one list, so they cannot drift apart.
function partnerEditPageKeys(partner: EditablePartner, slugFromUrl: string, variant: string | null): string[] {
  const identifiers = Array.from(new Set([
    slugFromUrl,
    ...writeGrantIdentifiers(partner),
    ...(Array.isArray(partner.legacyViewSlugs)
      ? partner.legacyViewSlugs.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : []),
  ]));
  // WHAT: Base keys are ALWAYS in the set; variant-composed keys join them
  //     when a variant param is present (any value — 'default' included, since
  //     the client composes its grant key for the literal 'default' too).
  // WHY: A password on the base page must cover every variant of it. Checking
  //     only composed keys let ?variant=virtual-default:partner:<id> (a
  //     predictable id resolveReportVariant accepts) read base data — and PUT
  //     stored variants — past a base-page password, because the composed key
  //     has no page_passwords row of its own (review finding, messmass#386).
  return variant
    ? [...identifiers, ...identifiers.map((id) => variantPageKey(id, variant))]
    : identifiers;
}

function variantPageKey(identifier: string, variant: string): string {
  return `${identifier}::variant=${variant}`;
}

// WHAT: The identifiers a partner-edit grant may be keyed to and still
//     authorise a save: the partner's _id and its viewSlug. Legacy slugs only
//     ever cut grants off (see hasPartnerWriteGrant).
function writeGrantIdentifiers(partner: EditablePartner): string[] {
  return [
    partner._id.toString(),
    ...(typeof partner.viewSlug === 'string' && partner.viewSlug ? [partner.viewSlug] : []),
  ];
}

// WHAT: Page-password gate for this editor surface, checked across every key
//     in partnerEditPageKeys.
// WHY: Same page-password model as /api/projects/edit/[slug]: unprotected
//     page => open; protected => a grant for any alias of the same page or an
//     admin session (messmass#386). Returns how the caller passed, because GET
//     decides from that whether to renew a grant. It is a READ gate: on a
//     partner with no password it admits everyone, so it never decides a save
//     (see callerMayWrite).
async function requirePartnerEditPageAccess(pageKeys: string[]): Promise<PageAccessDecision> {
  return requirePageAccessDecision('partner-edit', pageKeys);
}

// WHAT: A custom variant named in `?variant=`, or null for the default report
//     (no variant, an empty one, or the literal 'default').
function customVariantOf(variant: string | null): string | null {
  return variant && variant !== 'default' ? variant : null;
}

// WHAT: Which partner-edit grants GET renews with the editor it serves: exactly
//     the ones the caller already holds for this page, and only when a grant is
//     what let the caller in.
// WHY: A password holder's grant is renewed on every load, so an editor left
//     open past 12 hours keeps saving as long as it re-fetches. The gate lists
//     only grants newer than the current password, so setting or regenerating
//     the password still ends a holder's access at their next load. Nothing is
//     issued for an unprotected partner editor, unlike the event editor: a
//     partner's edit slug is the same slug as its public report link
//     (/partner-report/<viewSlug>), and its raw _id is public too, so a grant
//     issued for holding either would turn every public report link into
//     write access to the partner (F-009). Saving there needs an admin session
//     or a page password; GET reports which through `canSave`. Nothing is
//     issued on the admin path either -- the session already authorises saves.
function partnerEditGrantIds(access: PageAccessDecision): string[] {
  return access.allowed && access.via === 'grant' ? access.heldPageIds : [];
}

// WHAT: Does this request hold a current partner-edit grant for this custom
//     variant of this partner -- the key a variant password unlock mints?
// WHY: A password can be set on one variant alone (`<slug>::variant=<v>`), and
//     PartnerEditClient then unlocks under that composed key, which
//     hasPartnerWriteGrant (base keys only) does not look at. This is the same
//     rule extended to the variant: a grant keyed to the _id or viewSlug
//     composed with this variant, issued no earlier than the newest password on
//     any key the page gate checks for it, so setting or regenerating the
//     variant's or the base page's password cuts earlier holders off. A grant
//     for another variant, another partner or a legacy slug does not count.
async function hasPartnerVariantWriteGrant(
  partner: EditablePartner,
  variant: string,
  pageKeys: string[]
): Promise<boolean> {
  const grantIds = writeGrantIdentifiers(partner).map((id) => variantPageKey(id, variant));
  return (await currentPageGrants('partner-edit', grantIds, pageKeys)).length > 0;
}

// WHAT: May this caller save this partner editor? Used by GET to report
//     `canSave` and by PUT below to authorise a custom variant save, so the
//     two cannot disagree.
// WHY: The page gate alone is not write access. On a partner with no
//     partner-edit password it admits everyone, and the slug it admits them by
//     is the public report slug (/partner-report/<viewSlug>, variants included)
//     -- holding it proves nothing (F-009). Before this, PUT
//     ?variant=<custom> wrote for anyone the gate let in, so every public
//     report link could overwrite that variant's report text, images and
//     logo. A save now needs what PUT /api/partners (requirePartnerWriteAccess)
//     needs for the default report, on protected and unprotected partners
//     alike: an admin session, or a current partner-edit grant for the
//     partner's _id or viewSlug. A custom variant also accepts a current grant
//     for that variant's own key (hasPartnerVariantWriteGrant). The default
//     report saves through PUT /api/partners, so there only
//     hasPartnerWriteGrant counts.
async function callerMayWrite(
  access: PageAccessDecision,
  partner: EditablePartner,
  customVariant: string | null,
  pageKeys: string[]
): Promise<boolean> {
  if (!access.allowed) return false;
  if (access.via === 'admin') return true;
  if (await hasPartnerWriteGrant(partner._id.toString(), partner.viewSlug, partner.legacyViewSlugs)) return true;
  if (customVariant && (await hasPartnerVariantWriteGrant(partner, customVariant, pageKeys))) return true;
  return Boolean(await getAdminUser());
}

export const dynamic = 'force-dynamic';

// WHAT: Upper bound on one invocation of these handlers, in seconds.
// WHY: The partner editor gives a save 25 seconds before it treats the request
//     as lost and sends it again (SAVE_REQUEST_TIMEOUT_MS, lib/editorSaveQueue.ts).
//     A save the platform let run past that could land after the retry had,
//     so the function must be stopped first. Same limit as PUT /api/projects.
export const maxDuration = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let slug: string | undefined;
  try {
    // WHAT: Await params Promise (Next.js 15 requirement)
    // WHY: Next.js 15 changed params to async to support edge runtime
    const paramsResolved = await params;
    slug = paramsResolved.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const looksLikeLegacyViewSlug = !slug.includes('/') && slug.trim().length > 0;

    if (!looksLikeLegacyViewSlug) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner identifier format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    const partner = await findPartnerByIdentifier(db as any, slug);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // SECURITY (messmass#386): gate after identity resolution so all of the
    //     partner's aliases are checked (see requirePartnerEditPageAccess).
    const variantSlug = new URL(request.url).searchParams.get('variant');
    const pageKeys = partnerEditPageKeys(partner, slug, variantSlug);
    const access = await requirePartnerEditPageAccess(pageKeys);
    if (!access.allowed) return access.response;
    const grantPageIds = partnerEditGrantIds(access);

    const canSave = await callerMayWrite(access, partner, customVariantOf(variantSlug), pageKeys);

    // WHAT: Return partner data with stats structure for content editing
    // WHY: Partner editor needs same structure as event editor but only for content fields
    // HOW: Initialize empty stats object if none exists, preserve existing content
    const partnerData = {
      _id: partner._id.toString(),
      name: partner.name,
      viewSlug: partner.viewSlug,
      emoji: partner.emoji,
      showEmoji: partner.showEmoji ?? true,
      logoUrl: partner.logoUrl,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      styleId: partner.styleId ? partner.styleId.toString() : undefined,
      reportTemplateId: partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined,
      showEventsList: partner.showEventsList ?? true, // Default to true for backward compatibility
      showEventsListTitle: partner.showEventsListTitle ?? true, // Default to true for backward compatibility
      showEventsListDetails: partner.showEventsListDetails ?? true, // Default to true for backward compatibility
      showOnlyTeam1Events: partner.showOnlyTeam1Events ?? false,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      // WHAT: Partner stats for content editing (reportText*, reportImage*)
      // WHY: Store partner-level customizations separate from event aggregation
      // HOW: Initialize empty object if no stats exist, preserve existing content
      stats: partner.stats || {}
    };

    if (variantSlug && variantSlug !== 'default') {
      const resolvedVariant = await resolveReportVariant(db as any, 'partner', partner._id.toString(), variantSlug);

      return withPageAccessGrant(NextResponse.json({
        success: true,
        partner: {
          ...partnerData,
          emoji: resolvedVariant.variant.emoji ?? partnerData.emoji,
          logoUrl: resolvedVariant.variant.logoUrl ?? partnerData.logoUrl,
          styleId: resolvedVariant.variant.styleId ?? partnerData.styleId,
          reportTemplateId: resolvedVariant.variant.reportTemplateId ?? partnerData.reportTemplateId,
          showEmoji: resolvedVariant.variant.showEmoji ?? partnerData.showEmoji,
          showEventsList: resolvedVariant.variant.showEventsList ?? partnerData.showEventsList,
          showEventsListTitle: resolvedVariant.variant.showEventsListTitle ?? partnerData.showEventsListTitle,
          showEventsListDetails: resolvedVariant.variant.showEventsListDetails ?? partnerData.showEventsListDetails,
          // The variant report and PUT both read the variant's own value; loading the
          // partner's here made the editor show (and re-save) the wrong filter.
          showOnlyTeam1Events: resolvedVariant.variant.showOnlyTeam1Events ?? partnerData.showOnlyTeam1Events,
          stats: resolvedVariant.variant.statsOverrides || {},
          reportVariant: resolvedVariant.variant,
        },
        canSave,
      }), 'partner-edit', grantPageIds);
    }

    return withPageAccessGrant(NextResponse.json({
      success: true,
      partner: partnerData,
      canSave,
    }), 'partner-edit', grantPageIds);
  } catch (error) {
    logError('Failed to fetch partner for editing', { context: 'partners-edit', slug: slug || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner for editing' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let slug: string | undefined;
  try {
    const paramsResolved = await params;
    slug = paramsResolved.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const looksLikeLegacyViewSlug = !slug.includes('/') && slug.trim().length > 0;

    if (!looksLikeLegacyViewSlug) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner identifier format' },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      tabId?: unknown;
      clientSeq?: unknown;
      metadata?: {
        emoji?: string;
        logoUrl?: string | null;
        stats?: Record<string, unknown>;
        statsChanges?: Record<string, unknown>;
        statsRemoved?: string[];
        reportTemplateId?: string;
        styleId?: string;
        showEmoji?: boolean;
        showEventsList?: boolean;
        showEventsListTitle?: boolean;
        showEventsListDetails?: boolean;
        showOnlyTeam1Events?: boolean;
      };
    } | null;

    if (!body?.metadata) {
      return NextResponse.json({ success: false, error: 'metadata is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    const partner = await findPartnerByIdentifier(db as any, slug);

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    // SECURITY (messmass#386): same alias-aware gate as GET — the editor PUTs
    //     by raw _id while the page grant is keyed by the URL slug.
    const variantSlug = new URL(request.url).searchParams.get('variant');
    const pageKeys = partnerEditPageKeys(partner, slug, variantSlug);
    const access = await requirePartnerEditPageAccess(pageKeys);
    if (!access.allowed) return access.response;

    // SECURITY (F-009): passing the gate is not write access. On a partner with
    //     no partner-edit password the gate admits anyone holding the public
    //     report slug or the raw _id, which let an anonymous caller rewrite a
    //     variant's report text, images and logo. Without an admin session this
    //     needs a current partner-edit grant for the partner (callerMayWrite),
    //     protected partner or not. Refused before anything is read or written,
    //     with the same 401 for every cause so it discloses nothing.
    const customVariant = customVariantOf(variantSlug);
    if (!(await callerMayWrite(access, partner, customVariant, pageKeys))) {
      return partnerEditAccessRequired();
    }

    if (!customVariant) {
      return NextResponse.json(
        { success: false, error: 'Only custom partner variants can be updated through this route' },
        { status: 400 }
      );
    }

    const { variants } = await listReportVariants(db as any, 'partner', partner._id.toString());
    const targetVariant = variants.find((variant) => variant.slug === customVariant || variant._id === customVariant);
    if (!targetVariant || targetVariant._id.startsWith('virtual-default:')) {
      return NextResponse.json({ success: false, error: 'Report variant not found' }, { status: 404 });
    }

    const metadata = body.metadata;

    // WHAT: The variant's report content: whole (`stats`, editor tabs opened
    //     before field-level saves) or field-level (`statsChanges` /
    //     `statsRemoved`, the partner editor), never both; left as stored when
    //     the body has neither.
    // WHY: A field-level save writes only the slots the editor changed since
    //     its last confirmed save, as `statsOverrides.<key>` paths
    //     (updateReportVariant), so a slot another tab or an admin saved
    //     meanwhile is kept -- also one saved between this request's read and
    //     its write. A body without stats used to store {} and wipe every
    //     override.
    const statsFieldChanges = parseStatsFieldChanges(metadata);
    if (!statsFieldChanges.ok) {
      return NextResponse.json({ success: false, error: statsFieldChanges.error }, { status: 400 });
    }
    if (statsFieldChanges.value && metadata.stats !== undefined) {
      return NextResponse.json(
        { success: false, error: 'Send either stats or statsChanges/statsRemoved, not both' },
        { status: 400 }
      );
    }
    const statsOverrides = statsFieldChanges.value
      ? undefined
      : metadata.stats !== undefined
        ? metadata.stats || {}
        : undefined;

    // WHAT: The late-write guard (lib/statsFieldChanges.ts), read from the
    //     body next to `metadata`: the write is conditional on no save from
    //     the same editor tab with the same or a higher number having landed.
    // WHY: A save the editor gave up on (25 s) and sent again could otherwise
    //     land after the newer one and put the older content back.
    const sequence = parseEditorSequence(body);
    if (!sequence.ok) {
      return NextResponse.json({ success: false, error: sequence.error }, { status: 400 });
    }

    // WHAT: An empty (or null) logoUrl removes the variant's own logo, so the
    //     variant shows the partner's again; a missing one leaves it as is.
    // WHY: Removing the logo in the partner editor sends logoUrl '' (see
    //     PartnerEditorDashboard). It used to be read as "not sent", so the
    //     removal was confirmed as saved while the old logo stayed, and came
    //     back on the next load.
    const logoUrl =
      metadata.logoUrl === '' || metadata.logoUrl === null
        ? null
        : metadata.logoUrl
          ? String(metadata.logoUrl)
          : undefined;

    const variant = await updateReportVariant(db as any, targetVariant._id, {
      statsOverrides,
      emoji: metadata.emoji ? String(metadata.emoji) : undefined,
      logoUrl,
      styleId: metadata.styleId ? String(metadata.styleId) : undefined,
      reportTemplateId: metadata.reportTemplateId ? String(metadata.reportTemplateId) : undefined,
      showEmoji: metadata.showEmoji,
      showEventsList: metadata.showEventsList,
      showEventsListTitle: metadata.showEventsListTitle,
      showEventsListDetails: metadata.showEventsListDetails,
      showOnlyTeam1Events: metadata.showOnlyTeam1Events,
    }, {
      statsOverridesChanges: statsFieldChanges.value,
      sequence: sequence.value,
    });

    // WHAT: A newer save from the same editor tab is already stored.
    // WHY: 200 with `stale: true`, as PUT /api/partners and PUT /api/projects
    //     answer: that save carried everything this one did, so the editor
    //     counts it as done (see sendJsonForSave).
    if (!variant) {
      return NextResponse.json({ success: true, stale: true });
    }

    return NextResponse.json({
      success: true,
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        viewSlug: partner.viewSlug,
        emoji: variant.emoji ?? partner.emoji,
        logoUrl: variant.logoUrl ?? partner.logoUrl,
        hashtags: partner.hashtags || [],
        categorizedHashtags: partner.categorizedHashtags || {},
        styleId: variant.styleId ?? (partner.styleId ? partner.styleId.toString() : undefined),
        reportTemplateId: variant.reportTemplateId ?? (partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined),
        showEventsList: variant.showEventsList ?? partner.showEventsList ?? true,
        showEventsListTitle: variant.showEventsListTitle ?? partner.showEventsListTitle ?? true,
        showEventsListDetails: variant.showEventsListDetails ?? partner.showEventsListDetails ?? true,
        showOnlyTeam1Events: variant.showOnlyTeam1Events ?? partner.showOnlyTeam1Events ?? false,
        createdAt: partner.createdAt,
        updatedAt: new Date().toISOString(),
        stats: variant.statsOverrides || {},
        reportVariant: variant,
      },
    });
  } catch (error) {
    logError('Failed to update partner variant for editing', { context: 'partners-edit-put', slug: slug || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update partner variant for editing',
      },
      { status: 500 }
    );
  }
}
