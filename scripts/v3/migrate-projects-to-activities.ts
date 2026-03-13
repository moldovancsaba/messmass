import mongoose from 'mongoose';
import Organization from '../../lib/models/v3/Organization';
import Entity from '../../lib/models/v3/Entity';
import Activity from '../../lib/models/v3/Activity';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * WHAT: Migrates V2 Projects to V3 Activities
 * WHY: Enable historical KPI migration and deep-linking in V3 Designer
 */
async function migrateProjects() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const masterOrg = await Organization.findOne({ slug: 'master' });
    if (!masterOrg) {
      console.error('❌ Master Org not found.');
      process.exit(1);
    }
    const orgId = masterOrg._id;

    const projectsCollection = mongoose.connection.collection('projects');
    const projects = await projectsCollection.find({}).toArray();
    console.log(`🚀 Migrating ${projects.length} V2 Projects...`);

    let migratedCount = 0;
    for (const project of projects) {
      const existing = await Activity.findOne({ "metadata.originalId": project._id.toString() });
      if (existing) continue;

      // Find Owner Entity (Partner 1)
      let ownerId = null;
      if (project.partner1) {
        const ownerPartnerId = project.partner1._id || project.partner1;
        const entity = await Entity.findOne({ "metadata.v2PartnerId": ownerPartnerId });
        ownerId = entity ? entity._id : null;
      }

      await Activity.create({
        organizationId: orgId,
        ownerEntityId: ownerId,
        name: project.eventName,
        type: 'event',
        status: 'completed', // Assuming historical
        startDate: project.eventDate ? new Date(project.eventDate) : new Date(project.createdAt),
        metadata: {
          originalId: project._id.toString(),
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {},
          reportTemplateId: project.reportTemplateId?.toString(),
          styleIdEnhanced: project.styleIdEnhanced?.toString()
        }
      });
      migratedCount++;
    }

    console.log(`\n✨ Successfully migrated ${migratedCount} projects to V3 Activities.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProjects();
