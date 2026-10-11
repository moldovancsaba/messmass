// lib/projectPartnerRef.ts
// WHAT: Which partner an event (project) document points at as its home team (partner1) or visitor (partner2).
// WHY: Projects store the link as `partner1Id` / `partner2Id` (app/api/projects/route.ts POST and PUT, the fixture
//     importers). Older documents, and every event assigned through /admin/project-partners
//     (app/api/admin/project-partners/route.ts, which still writes the legacy fields), carry `partner1` / `partner2`
//     instead, as an ObjectId or as a populated { _id } object. The report template and style resolution read only
//     the legacy field and so skipped the partner level for every event stored the current way (messmass#430).
//     lib/sponsorshipHub.ts and lib/partnershipLifecycle.ts already tolerate both shapes in their queries.
// HOW: The current field wins, the legacy field is the fallback. When a document carries both and they differ, the
//     current one is used, because it is the one the hero, the editor and the camera frame read, so the template
//     comes from the same partner whose logo is shown. A reference that is not a valid ObjectId gives null.

import { ObjectId } from 'mongodb';

type Doc = Record<string, unknown>;

export type ProjectPartnerSide = 'home' | 'visitor';

/** Accepts an ObjectId, a 24-hex string or a populated `{ _id }` object; anything else is null. */
export function toPartnerObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (value && typeof value === 'object' && '_id' in (value as Doc)) return toPartnerObjectId((value as Doc)._id);
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

/**
 * The partner an event document links to on one side: `partner1Id` (else legacy `partner1`) for the home team,
 * `partner2Id` (else legacy `partner2`) for the visitor. Null when the side is not set.
 */
export function projectPartnerId(project: Doc | null | undefined, side: ProjectPartnerSide = 'home'): ObjectId | null {
  if (!project) return null;
  const current = side === 'home' ? project.partner1Id : project.partner2Id;
  const legacy = side === 'home' ? project.partner1 : project.partner2;
  return toPartnerObjectId(current) ?? toPartnerObjectId(legacy);
}
