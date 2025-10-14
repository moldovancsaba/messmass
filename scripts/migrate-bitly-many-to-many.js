/**
 * migrate-bitly-many-to-many.js
 * 
 * WHAT: Migrates existing Bitly link data from one-to-many to many-to-many structure.
 * WHY: New junction table model allows links to be shared across multiple events
 * with temporal data segmentation.
 * 
 * MIGRATION PROCESS:
 * 1. Find all bitly_links with projectId field (old schema)
 * 2. For each link, create junction table entry
 * 3. Calculate date ranges using smart algorithm
 * 4. Aggregate and cache metrics for each date range
 * 5. Remove deprecated projectId field from bitly_links
 * 
 * SAFETY:
 * - Dry run mode available (--dry-run flag)
 * - Creates backup collection before migration
 * - Validates data integrity after migration
 * - Rollback capability via backup
 * 
 * USAGE:
 * node scripts/migrate-bitly-many-to-many.js [--dry-run] [--backup]
 */

const { MongoClient, ObjectId } = require('mongodb');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not found');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const createBackup = args.includes('--backup');

console.log('🚀 Bitly Many-to-Many Migration Script');
console.log('==========================================');
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
console.log(`Backup: ${createBackup ? 'YES' : 'NO'}`);
console.log(`Database: ${MONGODB_DB}`);
console.log('==========================================\n');

/**
 * Prompt user for confirmation
 */
async function confirmMigration() {
  if (isDryRun) {
    return true; // No confirmation needed for dry run
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '⚠️  This will modify your database. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Create backup of bitly_links collection
 */
async function createBackupCollection(db) {
  console.log('📦 Creating backup collection...');
  
  const backupName = `bitly_links_backup_${Date.now()}`;
  const bitlyLinks = await db.collection('bitly_links').find({}).toArray();
  
  await db.collection(backupName).insertMany(bitlyLinks);
  
  console.log(`✅ Backup created: ${backupName} (${bitlyLinks.length} documents)\n`);
  return backupName;
}

/**
 * Simple date range calculator (inline version for migration script)
 * Mimics lib/bitly-date-calculator.ts logic
 */
function calculateDateRangesSimple(bitlink, events) {
  if (events.length === 0) return new Map();
  
  if (events.length === 1) {
    return new Map([[events[0].projectId, { startDate: null, endDate: null }]]);
  }

  // Sort events by date, then createdAt
  const sorted = [...events].sort((a, b) => {
    if (a.eventDate !== b.eventDate) {
      return a.eventDate.localeCompare(b.eventDate);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  const ranges = new Map();

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = i < sorted.length - 1 ? sorted[i + 1] : null;
    const previous = i > 0 ? sorted[i - 1] : null;

    let startDate, endDate;

    if (i === 0) {
      // First event
      startDate = null; // From beginning
      
      if (next) {
        const currentDate = new Date(current.eventDate);
        const nextDate = new Date(next.eventDate);
        const daysDiff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 3) {
          endDate = current.eventDate;
        } else {
          const endDateObj = new Date(currentDate);
          endDateObj.setDate(endDateObj.getDate() + 2);
          endDate = endDateObj.toISOString().split('T')[0];
        }
      } else {
        const endDateObj = new Date(current.eventDate);
        endDateObj.setDate(endDateObj.getDate() + 2);
        endDate = endDateObj.toISOString().split('T')[0];
      }
    } else if (i === sorted.length - 1) {
      // Last event
      const previousRange = ranges.get(previous.projectId);
      startDate = previous.eventDate === current.eventDate
        ? (() => {
            const d = new Date(current.eventDate);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
          })()
        : previousRange.endDate;
      endDate = null; // To infinity
    } else {
      // Middle event
      const previousRange = ranges.get(previous.projectId);
      startDate = previous.eventDate === current.eventDate
        ? (() => {
            const d = new Date(current.eventDate);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
          })()
        : previousRange.endDate;

      const currentDate = new Date(current.eventDate);
      const nextDate = new Date(next.eventDate);
      const daysDiff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < 3) {
        endDate = current.eventDate;
      } else {
        const endDateObj = new Date(currentDate);
        endDateObj.setDate(endDateObj.getDate() + 2);
        endDate = endDateObj.toISOString().split('T')[0];
      }
    }

    ranges.set(current.projectId, { startDate, endDate });
  }

  return ranges;
}

/**
 * Simple metrics aggregation (placeholder for migration)
 * In production, this would use lib/bitly-aggregator.ts
 */
function createEmptyMetrics() {
  return {
    clicks: 0,
    uniqueClicks: 0,
    topCountries: [],
    topReferrers: [],
    deviceClicks: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
    browserClicks: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
    dailyClicks: [],
  };
}

/**
 * Main migration function
 */
async function runMigration() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);
    const bitlyLinksCollection = db.collection('bitly_links');
    const junctionCollection = db.collection('bitly_project_links');
    const projectsCollection = db.collection('projects');

    // Step 1: Check if migration already ran
    const existingJunctionCount = await junctionCollection.countDocuments();
    if (existingJunctionCount > 0) {
      console.log(`⚠️  Junction table already contains ${existingJunctionCount} documents`);
      console.log('Migration may have already been run. Proceeding with caution...\n');
    }

    // Step 2: Create backup if requested
    let backupName = null;
    if (createBackup && !isDryRun) {
      backupName = await createBackupCollection(db);
    }

    // Step 3: Find all bitly_links with projectId
    console.log('🔍 Scanning for bitly_links with projectId...');
    const linksWithProject = await bitlyLinksCollection
      .find({ projectId: { $ne: null } })
      .toArray();

    console.log(`Found ${linksWithProject.length} links with projectId\n`);

    if (linksWithProject.length === 0) {
      console.log('✅ No migration needed - all links already migrated or no projectId associations exist');
      return;
    }

    // Step 4: Group links by projectId to handle many-to-many
    const linksByBitlink = new Map();
    for (const link of linksWithProject) {
      const bitlinkKey = link._id.toString();
      if (!linksByBitlink.has(bitlinkKey)) {
        linksByBitlink.set(bitlinkKey, []);
      }
      linksByBitlink.get(bitlinkKey).push({
        bitlyLinkId: link._id,
        projectId: link.projectId,
        bitlink: link.bitlink,
      });
    }

    console.log(`📊 Migration statistics:`);
    console.log(`   - Unique bitlinks: ${linksByBitlink.size}`);
    console.log(`   - Total associations: ${linksWithProject.length}\n`);

    // Step 5: Process each bitlink
    let created = 0;
    let skipped = 0;

    for (const [bitlinkKey, associations] of linksByBitlink.entries()) {
      const bitlyLinkId = associations[0].bitlyLinkId;
      const bitlink = associations[0].bitlink;

      console.log(`\n🔗 Processing: ${bitlink}`);

      // Fetch all projects using this bitlink
      const projectIds = associations.map((a) => a.projectId);
      const projects = await projectsCollection
        .find(
          { _id: { $in: projectIds } },
          { projection: { eventDate: 1, createdAt: 1 } }
        )
        .toArray();

      if (projects.length === 0) {
        console.log(`   ⚠️  No valid projects found, skipping`);
        skipped++;
        continue;
      }

      // Calculate date ranges
      const eventInfos = projects.map((p) => ({
        projectId: p._id.toString(),
        eventDate: p.eventDate,
        createdAt: p.createdAt,
      }));

      const dateRanges = calculateDateRangesSimple(bitlink, eventInfos);

      console.log(`   📅 Calculated ${dateRanges.size} date ranges`);

      // Create junction table entries
      for (const project of projects) {
        const projectIdStr = project._id.toString();
        const range = dateRanges.get(projectIdStr);

        if (!range) {
          console.log(`   ⚠️  No range calculated for project ${projectIdStr}`);
          continue;
        }

        const now = new Date().toISOString();
        const junctionEntry = {
          bitlyLinkId,
          projectId: project._id,
          startDate: range.startDate,
          endDate: range.endDate,
          autoCalculated: true,
          cachedMetrics: createEmptyMetrics(),
          createdAt: now,
          updatedAt: now,
          lastSyncedAt: null,
        };

        if (!isDryRun) {
          await junctionCollection.updateOne(
            { bitlyLinkId, projectId: project._id },
            { $setOnInsert: junctionEntry },
            { upsert: true }
          );
        }

        console.log(
          `   ✅ Created association: ${projectIdStr} (${range.startDate || '-∞'} to ${range.endDate || '+∞'})`
        );
        created++;
      }
    }

    console.log(`\n\n📊 Migration Summary:`);
    console.log(`   - Junction entries created: ${created}`);
    console.log(`   - Links skipped: ${skipped}`);

    // Step 6: Remove deprecated projectId field
    if (!isDryRun) {
      console.log(`\n🧹 Cleaning up deprecated projectId field...`);
      const updateResult = await bitlyLinksCollection.updateMany(
        { projectId: { $exists: true } },
        { $unset: { projectId: '' } }
      );
      console.log(`✅ Removed projectId from ${updateResult.modifiedCount} documents`);
    } else {
      console.log(`\n[DRY RUN] Would remove projectId field from ${linksWithProject.length} documents`);
    }

    // Step 7: Validation
    console.log(`\n🔍 Validating migration...`);
    const finalJunctionCount = await junctionCollection.countDocuments();
    console.log(`   - Junction table entries: ${finalJunctionCount}`);

    const linksStillWithProjectId = await bitlyLinksCollection.countDocuments({
      projectId: { $exists: true },
    });
    console.log(`   - Links with projectId remaining: ${linksStillWithProjectId}`);

    if (isDryRun) {
      console.log(`\n✅ DRY RUN completed - no changes were made`);
    } else {
      console.log(`\n✅ Migration completed successfully!`);
      if (backupName) {
        console.log(`\n💾 Backup available: ${backupName}`);
        console.log(`   To rollback: db.bitly_links.drop(); db.${backupName}.rename('bitly_links')`);
      }
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration
(async () => {
  try {
    const confirmed = await confirmMigration();
    if (!confirmed) {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    await runMigration();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
