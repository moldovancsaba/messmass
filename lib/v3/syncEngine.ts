import connectV3 from '@/lib/mongoose-v3';
import V3Entity from '@/lib/models/v3/Entity';
import V3Activity from '@/lib/models/v3/Activity';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';
import mongoose from 'mongoose';

/**
 * V3 Sync Engine
 * 
 * WHAT: Logic to mirror V2 metadata changes to V3 models
 * WHY: Ensure that legacy Admin edits keep the V3 system consistent
 */

const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

/**
 * Syncs a V2 Partner to a V3 Entity
 */
export async function syncPartnerToV3Entity(v2Partner: any) {
  try {
    await connectV3();
    
    const partnerId = v2Partner._id.toString();
    
    // WHAT: Check for existing entity to prevent overwriting manual org assignments
    // WHY: Superadmins might have moved this partner to a specific V3 Organization
    const existing = await V3Entity.findById(v2Partner._id).lean();
    let orgIdToSet = new mongoose.Types.ObjectId(MASTER_ORG_ID);
    
    if (existing && existing.organizationId && existing.organizationId.toString() !== MASTER_ORG_ID) {
      orgIdToSet = existing.organizationId;
    }

    await V3Entity.findOneAndUpdate(
      { _id: v2Partner._id },
      {
        $set: {
          organizationId: orgIdToSet,
          name: v2Partner.name,
          metadata: {
            originalId: partnerId,
            emoji: v2Partner.emoji || '🎯',
            description: v2Partner.description || '',
            tags: v2Partner.tags || [],
            logoUrl: v2Partner.logoUrl,
            sportsDb: v2Partner.sportsDb,
            footballData: v2Partner.footballData,
            viewSlug: v2Partner.viewSlug,
            styleId: v2Partner.styleId?.toString(),
            reportTemplateId: v2Partner.reportTemplateId?.toString(),
            clickerSetId: v2Partner.clickerSetId?.toString(),
            googleSheetsUrl: v2Partner.googleSheetsUrl,
            isDraft: v2Partner.isDraft,
            originalData: JSON.parse(JSON.stringify(v2Partner))
          }
        },
        $setOnInsert: {
          type: 'brand' // Default
        }
      },
      { upsert: true, new: true }
    );
  } catch (error: any) {
    console.error('❌ [Sync] Partner sync failed:', error.message, error.stack);
  }
}

/**
 * Syncs a V2 Project to a V3 Activity
 */
export async function syncProjectToV3Activity(v2Project: any) {
  try {
    await connectV3();
    
    const projectId = v2Project._id.toString();
    const defaultOrgId = new mongoose.Types.ObjectId(MASTER_ORG_ID);
    let orgIdToSet = defaultOrgId;

    // WHAT: Inherit organization from primary partner
    // WHY: Activities belong to the organization of their owner entity
    if (v2Project.partner1Id) {
      const ownerEntity = await V3Entity.findById(v2Project.partner1Id).lean();
      if (ownerEntity && ownerEntity.organizationId) {
        orgIdToSet = ownerEntity.organizationId;
      }
    }
    
    // 1. Update Activity
    const activity = await V3Activity.findOneAndUpdate(
      { "metadata.originalId": projectId },
      {
        $set: {
          organizationId: orgIdToSet,
          name: v2Project.eventName,
          startDate: v2Project.eventDate ? new Date(v2Project.eventDate) : new Date(),
          metadata: {
            originalId: projectId,
            hashtags: v2Project.hashtags || [],
            categorizedHashtags: v2Project.categorizedHashtags || {},
            reportTemplateId: v2Project.reportTemplateId?.toString(),
            styleIdEnhanced: v2Project.styleIdEnhanced?.toString(),
            viewSlug: v2Project.viewSlug,
            stats: v2Project.stats,
            originalData: JSON.parse(JSON.stringify(v2Project))
          }
        },
        $setOnInsert: {
          type: 'event'
        }
      },
      { upsert: true, new: true }
    );
    
    if (!activity) return;

    // 2. Sync Participants (Partner 1 and 2)
    // Use the SAME orgId as the activity for consistency
    const activityOrgId = activity.organizationId;

    if (v2Project.partner1Id) {
      const p1IdString = v2Project.partner1Id.toString();
      if (mongoose.Types.ObjectId.isValid(p1IdString)) {
        await V3ActivityParticipant.findOneAndUpdate(
          { 
            activityId: activity._id, 
            entityId: new mongoose.Types.ObjectId(p1IdString),
            organizationId: activityOrgId 
          },
          { $set: { role: 'primary_partner' } },
          { upsert: true }
        );
      }
    }

    if (v2Project.partner2Id) {
      const p2IdString = v2Project.partner2Id.toString();
      if (mongoose.Types.ObjectId.isValid(p2IdString)) {
        await V3ActivityParticipant.findOneAndUpdate(
          { 
            activityId: activity._id, 
            entityId: new mongoose.Types.ObjectId(p2IdString),
            organizationId: activityOrgId 
          },
          { $set: { role: 'visitor' } },
          { upsert: true }
        );
      }
    }
  } catch (error: any) {
    console.error('❌ [Sync] Project sync failed:', error.message, error.stack);
  }
}
