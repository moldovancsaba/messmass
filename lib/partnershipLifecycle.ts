// lib/partnershipLifecycle.ts
// WHAT: A partner's real lifecycle stage -- messmass#235, full model.
// WHY: Per the decisions made 2026-09-17, none of which were generic
//     defaults -- they encode how this business actually operates:
//       - Activation triggers the moment a project exists for the partner
//         (computed, no new field).
//       - Renewal triggers on time-since-last-event, not a tracked contract
//         date (none exists today) and not a purely manual flag.
//       - Stage is computed wherever a real data signal exists; Proposal and
//         Postmortem are the two states with no data signal (a partner with
//         zero recent events could be brand new OR formally ended -- nothing
//         in the data distinguishes those), so those two are the only ones a
//         stored override can set.
//       - "Readiness" means time-based only -- no invented performance
//         health score.
// HOW: Reuses the exact partner<->project matching lib/sponsorshipHub.ts
//     already proved out (partner1/partner2/partner1Id/partner2Id, as
//     ObjectId or string -- event documents were written under more than one
//     schema historically) rather than re-deriving it.

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export type PartnershipStage = 'proposal' | 'activation' | 'renewal' | 'postmortem';
export type LifecycleOverride = 'proposal' | 'postmortem';

/** Months since the last event before a partnership is considered due for a renewal conversation. */
export const RENEWAL_THRESHOLD_MONTHS = 6;

export interface PartnershipLifecycle {
  stage: PartnershipStage;
  /** True only when the stage came from an explicit admin override, not computation. */
  isOverridden: boolean;
  projectCount: number;
  mostRecentEventDate: string | null;
  monthsSinceLastEvent: number | null;
  /** Reporting/Proof is a capability available throughout Activation and Renewal, not a separate sequential stage (see the #235 audit: both already exist as live surfaces, used concurrently). */
  reportingAvailable: boolean;
}

/** Pure -- the actual stage decision, given already-fetched inputs. */
export function computeLifecycleStage(
  override: LifecycleOverride | null | undefined,
  projectCount: number,
  mostRecentEventDate: string | null,
  now: Date = new Date()
): { stage: PartnershipStage; isOverridden: boolean; monthsSinceLastEvent: number | null } {
  if (override === 'postmortem') return { stage: 'postmortem', isOverridden: true, monthsSinceLastEvent: null };
  if (override === 'proposal') return { stage: 'proposal', isOverridden: true, monthsSinceLastEvent: null };

  if (projectCount === 0 || !mostRecentEventDate) {
    return { stage: 'proposal', isOverridden: false, monthsSinceLastEvent: null };
  }

  const monthsSinceLastEvent = (now.getTime() - new Date(mostRecentEventDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const stage: PartnershipStage = monthsSinceLastEvent >= RENEWAL_THRESHOLD_MONTHS ? 'renewal' : 'activation';
  return { stage, isOverridden: false, monthsSinceLastEvent };
}

async function getCollections() {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  return { partners: db.collection('partners'), projects: db.collection('projects') };
}

export async function getPartnershipLifecycle(partnerId: string): Promise<PartnershipLifecycle | null> {
  if (!ObjectId.isValid(partnerId)) return null;
  const { partners, projects } = await getCollections();
  const partnerObjectId = new ObjectId(partnerId);

  const partner = await partners.findOne({ _id: partnerObjectId });
  if (!partner) return null;

  // The exact tolerant partner<->project match lib/sponsorshipHub.ts uses --
  // event documents were written under more than one historical schema.
  const matchingProjects = await projects
    .find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId },
        { partner1Id: partnerId },
        { partner2Id: partnerId },
      ],
    })
    .project({ eventDate: 1 })
    .sort({ eventDate: -1 })
    .toArray();

  const mostRecentEventDate = (matchingProjects[0]?.eventDate as string | undefined) || null;
  const override = partner.lifecycleStageOverride as LifecycleOverride | undefined;

  const { stage, isOverridden, monthsSinceLastEvent } = computeLifecycleStage(override, matchingProjects.length, mostRecentEventDate);

  return {
    stage,
    isOverridden,
    projectCount: matchingProjects.length,
    mostRecentEventDate,
    monthsSinceLastEvent: monthsSinceLastEvent !== null ? Math.round(monthsSinceLastEvent * 10) / 10 : null,
    reportingAvailable: matchingProjects.length > 0,
  };
}

export async function setLifecycleOverride(partnerId: string, override: LifecycleOverride | null): Promise<boolean> {
  if (!ObjectId.isValid(partnerId)) return false;
  const { partners } = await getCollections();
  const update = override
    ? { $set: { lifecycleStageOverride: override } }
    : { $unset: { lifecycleStageOverride: '' } };
  const result = await partners.updateOne({ _id: new ObjectId(partnerId) }, update);
  return result.matchedCount > 0;
}
