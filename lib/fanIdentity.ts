// lib/fanIdentity.ts
// WHAT: The canonical fan identity model -- messmass#227, Phase A.
// WHY: Every fan-related field in messmass today is an aggregate count
//     (`female`, `male`, `genAlpha`, `marketingOptin` -- all `number`). No
//     individual is identified anywhere in the data model; that is this
//     product's current privacy posture, not an oversight (see the #227
//     audit comment on GitHub, 2026-09-16). A fan identity graph reverses
//     that posture, so this is built to the narrowest version that satisfies
//     the issue's own acceptance checks without pre-deciding the open
//     legal/product questions (consent model shape, what counts as merge
//     evidence) that audit flagged as needing an answer from whoever owns
//     that at the organisation, not from engineering defaults.
// HOW: Two structural choices carry the whole risk-reduction:
//   1. No fan_identities document can be created without a consent record.
//      This is enforced here, not left to caller discipline.
//   2. There is no automatic identity resolution/merging in this version --
//      the issue's own "Out of Scope" section says as much ("identity
//      stitching beyond reasonable first-party boundaries in the first
//      version"). A suspected match becomes a fan_identity_merge_candidates
//      document; a human approves or rejects it. Nothing merges on its own,
//      so there is no confidence threshold to get wrong.
// Right-to-deletion (a real legal obligation this feature creates, named
//     explicitly in the #227 audit) is a real delete, not a soft-delete flag
//     -- see deleteFanIdentity.

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export interface FanIdentityConsent {
  /** Where consent was obtained -- free text in Phase A; no consent flow exists yet to constrain this to an enum. */
  source: string;
  consentedAt: string; // ISO 8601
  /** What this consent covers, e.g. ["engagement-tracking", "sponsor-audience-insights"]. */
  scope: string[];
}

export interface FanIdentity {
  _id: ObjectId;
  status: 'active' | 'merged';
  /** Set only when status === 'merged': the surviving identity this one was merged into. */
  mergedIntoId?: ObjectId;
  consent: FanIdentityConsent;
  createdAt: string;
  updatedAt: string;
}

export type FanIdentityLinkType = 'ticketing' | 'activation' | 'engagement' | 'report-interaction';

export interface FanIdentityLink {
  _id: ObjectId;
  fanIdentityId: ObjectId;
  linkType: FanIdentityLinkType;
  /** A generic pointer to the behavior's source -- deliberately loose since no real per-fan data source is wired up yet. */
  sourceRef: { collection: string; id: string };
  occurredAt: string;
  /** What ties this behavior to this identity, e.g. {type: 'qr-scan', value: '...'}. Free-form: Phase A has no real evidence source to standardize against yet. */
  evidence?: { type: string; value: string };
  createdAt: string;
}

export type MergeCandidateStatus = 'pending' | 'approved' | 'rejected';

export interface FanIdentityMergeCandidate {
  _id: ObjectId;
  identityIds: [ObjectId, ObjectId];
  /** Why a human flagged these as possibly the same fan. */
  evidence: string;
  status: MergeCandidateStatus;
  flaggedBy: string;
  flaggedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

async function getDb() {
  const client = await clientPromise;
  return client.db(config.dbName);
}

function identitiesCollection() {
  return getDb().then((db) => db.collection<FanIdentity>('fan_identities'));
}
function linksCollection() {
  return getDb().then((db) => db.collection<FanIdentityLink>('fan_identity_links'));
}
function mergeCandidatesCollection() {
  return getDb().then((db) => db.collection<FanIdentityMergeCandidate>('fan_identity_merge_candidates'));
}

export class MissingConsentError extends Error {
  constructor() {
    super('A fan identity cannot be created without a consent record.');
    this.name = 'MissingConsentError';
  }
}

export async function createFanIdentity(consent: FanIdentityConsent): Promise<FanIdentity> {
  if (!consent?.source?.trim() || !consent?.consentedAt?.trim() || !Array.isArray(consent.scope) || consent.scope.length === 0) {
    throw new MissingConsentError();
  }
  const collection = await identitiesCollection();
  const now = new Date().toISOString();
  const doc: Omit<FanIdentity, '_id'> = { status: 'active', consent, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc as FanIdentity);
  return { ...doc, _id: result.insertedId } as FanIdentity;
}

export async function getFanIdentity(id: string): Promise<FanIdentity | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await identitiesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function listFanIdentities(limit = 50): Promise<FanIdentity[]> {
  const collection = await identitiesCollection();
  return collection.find({}).sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 200)).toArray();
}

/** Real deletion, not a status flag -- right-to-deletion means the record and its links stop existing. */
export async function deleteFanIdentity(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const identities = await identitiesCollection();
  const links = await linksCollection();
  const _id = new ObjectId(id);
  await links.deleteMany({ fanIdentityId: _id });
  const result = await identities.deleteOne({ _id });
  return result.deletedCount > 0;
}

export async function addFanIdentityLink(
  fanIdentityId: string,
  input: { linkType: FanIdentityLinkType; sourceRef: { collection: string; id: string }; occurredAt: string; evidence?: { type: string; value: string } }
): Promise<FanIdentityLink | null> {
  const identity = await getFanIdentity(fanIdentityId);
  if (!identity) return null;
  const collection = await linksCollection();
  const doc: Omit<FanIdentityLink, '_id'> = {
    fanIdentityId: identity._id,
    linkType: input.linkType,
    sourceRef: input.sourceRef,
    occurredAt: input.occurredAt,
    evidence: input.evidence,
    createdAt: new Date().toISOString(),
  };
  const result = await collection.insertOne(doc as FanIdentityLink);
  return { ...doc, _id: result.insertedId } as FanIdentityLink;
}

export async function listFanIdentityLinks(fanIdentityId: string): Promise<FanIdentityLink[]> {
  if (!ObjectId.isValid(fanIdentityId)) return [];
  const collection = await linksCollection();
  return collection.find({ fanIdentityId: new ObjectId(fanIdentityId) }).sort({ occurredAt: -1 }).toArray();
}

/** A human flags two identities as possibly the same fan. Creates the review item; merges nothing. */
export async function flagMergeCandidate(identityIdA: string, identityIdB: string, evidence: string, flaggedBy: string): Promise<FanIdentityMergeCandidate | null> {
  if (!ObjectId.isValid(identityIdA) || !ObjectId.isValid(identityIdB) || identityIdA === identityIdB) return null;
  const collection = await mergeCandidatesCollection();
  const doc: Omit<FanIdentityMergeCandidate, '_id'> = {
    identityIds: [new ObjectId(identityIdA), new ObjectId(identityIdB)],
    evidence,
    status: 'pending',
    flaggedBy,
    flaggedAt: new Date().toISOString(),
  };
  const result = await collection.insertOne(doc as FanIdentityMergeCandidate);
  return { ...doc, _id: result.insertedId } as FanIdentityMergeCandidate;
}

export async function listMergeCandidates(status: MergeCandidateStatus = 'pending'): Promise<FanIdentityMergeCandidate[]> {
  const collection = await mergeCandidatesCollection();
  return collection.find({ status }).sort({ flaggedAt: -1 }).toArray();
}

/**
 * WHAT: The one governed merge action. Marks the second identity as merged into the
 *     first, moves its links over, and closes the review item -- explicit, human-
 *     triggered, superadmin-only (see the route guard), never automatic.
 */
export async function approveMergeCandidate(candidateId: string, reviewedBy: string): Promise<boolean> {
  if (!ObjectId.isValid(candidateId)) return false;
  const candidates = await mergeCandidatesCollection();
  const candidate = await candidates.findOne({ _id: new ObjectId(candidateId), status: 'pending' });
  if (!candidate) return false;

  const [survivorId, mergedId] = candidate.identityIds;
  const identities = await identitiesCollection();
  const links = await linksCollection();
  const now = new Date().toISOString();

  await links.updateMany({ fanIdentityId: mergedId }, { $set: { fanIdentityId: survivorId } });
  await identities.updateOne({ _id: mergedId }, { $set: { status: 'merged', mergedIntoId: survivorId, updatedAt: now } });
  await candidates.updateOne({ _id: candidate._id }, { $set: { status: 'approved', reviewedBy, reviewedAt: now } });
  return true;
}

export async function rejectMergeCandidate(candidateId: string, reviewedBy: string): Promise<boolean> {
  if (!ObjectId.isValid(candidateId)) return false;
  const candidates = await mergeCandidatesCollection();
  const result = await candidates.updateOne(
    { _id: new ObjectId(candidateId), status: 'pending' },
    { $set: { status: 'rejected', reviewedBy, reviewedAt: new Date().toISOString() } }
  );
  return result.matchedCount > 0;
}
