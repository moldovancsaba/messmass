// lib/loyaltyHub.ts
// WHAT: A loyalty hub shell -- missions, and the actions that contribute to
//     them -- messmass#229, Phase A.
// WHY: The issue's own scope is "quest and mission model" + "scan-in and
//     attendance reward mechanics" + "reporting on sponsor mission
//     participation." Every mission completion is also a fan behavior, so it
//     writes a fan_identity_link (messmass#227, linkType 'engagement') --
//     the same reuse decision #228 made, for the same reason: the linkage
//     this issue needs already exists, and a second mechanism would just be
//     a second source of truth for "what has this fan done."
// HOW: A LoyaltyMission is deliberately narrower than #228's ActivationTemplate
//     even though they look similar (both are "operator-defined, fan-facing,
//     sponsor-attributable formats"): a mission is repeatable (the same fan
//     can complete a scan-in mission at every home game) and accumulates
//     points, where an activation is a one-shot data-capture moment. Forcing
//     them into one model would be the #414 mistake again -- two things that
//     look alike until you check what they actually do. `pointsPerCompletion`
//     is the only quantitative concept in Phase A; a full scoring/redemption
//     engine is explicitly out of scope on the issue itself ("full rewards-
//     commerce engine in the first version").

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { addFanIdentityLink, getFanIdentity } from '@/lib/fanIdentity';

export type LoyaltyMissionType = 'scan-in' | 'attendance' | 'sponsor-mission' | 'digital-participation';
export type LoyaltyMissionStatus = 'draft' | 'active' | 'archived';

export interface LoyaltyMission {
  _id: ObjectId;
  name: string;
  description?: string;
  type: LoyaltyMissionType;
  /** Attributable to a sponsor/partner scope -- the issue's own constraint. */
  partnerId?: string;
  pointsPerCompletion: number;
  /** false = one-time mission (e.g. a season pass-holder bonus); true = can be completed repeatedly (e.g. scan in at every game). */
  repeatable: boolean;
  status: LoyaltyMissionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyCompletion {
  _id: ObjectId;
  missionId: ObjectId;
  fanIdentityId: ObjectId;
  pointsAwarded: number;
  occurredAt: string;
  createdAt: string;
}

async function getDb() {
  const client = await clientPromise;
  return client.db(config.dbName);
}
function missionsCollection() {
  return getDb().then((db) => db.collection<LoyaltyMission>('loyalty_missions'));
}
function completionsCollection() {
  return getDb().then((db) => db.collection<LoyaltyCompletion>('loyalty_completions'));
}

export async function createLoyaltyMission(input: {
  name: string;
  description?: string;
  type: LoyaltyMissionType;
  partnerId?: string;
  pointsPerCompletion: number;
  repeatable: boolean;
  createdBy: string;
}): Promise<LoyaltyMission> {
  const collection = await missionsCollection();
  const now = new Date().toISOString();
  const doc: Omit<LoyaltyMission, '_id'> = {
    name: input.name,
    description: input.description,
    type: input.type,
    partnerId: input.partnerId,
    pointsPerCompletion: input.pointsPerCompletion,
    repeatable: input.repeatable,
    status: 'draft',
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc as LoyaltyMission);
  return { ...doc, _id: result.insertedId } as LoyaltyMission;
}

export async function listLoyaltyMissions(): Promise<LoyaltyMission[]> {
  const collection = await missionsCollection();
  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function getLoyaltyMission(id: string): Promise<LoyaltyMission | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await missionsCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

/**
 * WHAT: Whether a fan is allowed to complete this mission again, given
 *     whether they already have. Pure -- no database access.
 * WHY: The one rule this feature cannot get wrong: a one-time bonus (a
 *     season-pass-holder mission, say) must not be claimable twice, or
 *     "loyalty actions must be measurable" (the issue's own constraint)
 *     stops being true. Extracted so this exact decision is unit-tested
 *     directly rather than only reachable through a live database call.
 */
export function canCompleteMission(mission: { repeatable: boolean }, hasExistingCompletion: boolean): boolean {
  return mission.repeatable || !hasExistingCompletion;
}

/**
 * WHAT: Record one completion of a mission by a fan, award its points, and
 *     link it into #227's identity graph.
 */
export async function recordCompletion(
  missionId: string,
  fanIdentityId: string,
  occurredAt: string
): Promise<LoyaltyCompletion | { error: 'mission_not_found' | 'identity_not_found' | 'already_completed' }> {
  const mission = await getLoyaltyMission(missionId);
  if (!mission) return { error: 'mission_not_found' };

  const identity = await getFanIdentity(fanIdentityId);
  if (!identity) return { error: 'identity_not_found' };

  const completions = await completionsCollection();
  const existing = mission.repeatable ? null : await completions.findOne({ missionId: mission._id, fanIdentityId: identity._id });
  if (!canCompleteMission(mission, Boolean(existing))) return { error: 'already_completed' };

  const doc: Omit<LoyaltyCompletion, '_id'> = {
    missionId: mission._id,
    fanIdentityId: identity._id,
    pointsAwarded: mission.pointsPerCompletion,
    occurredAt,
    createdAt: new Date().toISOString(),
  };
  const result = await completions.insertOne(doc as LoyaltyCompletion);
  const completion = { ...doc, _id: result.insertedId } as LoyaltyCompletion;

  await addFanIdentityLink(fanIdentityId, {
    linkType: 'engagement',
    sourceRef: { collection: 'loyalty_completions', id: completion._id.toString() },
    occurredAt,
    evidence: { type: 'loyalty-mission', value: mission._id.toString() },
  });

  return completion;
}

export async function listCompletions(missionId: string): Promise<LoyaltyCompletion[]> {
  if (!ObjectId.isValid(missionId)) return [];
  const collection = await completionsCollection();
  return collection.find({ missionId: new ObjectId(missionId) }).sort({ occurredAt: -1 }).toArray();
}

/** Total points a fan has accumulated across every mission -- the "loyalty behavior" state the hub is for. */
export async function getFanLoyaltyBalance(fanIdentityId: string): Promise<{ totalPoints: number; completionCount: number } | null> {
  if (!ObjectId.isValid(fanIdentityId)) return null;
  const collection = await completionsCollection();
  const completions = await collection.find({ fanIdentityId: new ObjectId(fanIdentityId) }).toArray();
  return {
    totalPoints: completions.reduce((sum, c) => sum + c.pointsAwarded, 0),
    completionCount: completions.length,
  };
}

/** Reporting on sponsor mission participation -- the issue's own acceptance check. */
export async function getMissionParticipation(missionId: string): Promise<{
  completionCount: number;
  uniqueFanCount: number;
  totalPointsAwarded: number;
} | null> {
  const mission = await getLoyaltyMission(missionId);
  if (!mission) return null;
  const completions = await listCompletions(missionId);
  const uniqueFans = new Set(completions.map((c) => c.fanIdentityId.toString()));
  return {
    completionCount: completions.length,
    uniqueFanCount: uniqueFans.size,
    totalPointsAwarded: completions.reduce((sum, c) => sum + c.pointsAwarded, 0),
  };
}
