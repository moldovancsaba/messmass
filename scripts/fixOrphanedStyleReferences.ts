#!/usr/bin/env ts-node

/**
 * Fix Orphaned Style References Script
 * 
 * WHAT: Identifies and fixes projects with styleIdEnhanced references to deleted styles
 * WHY: 16 projects reference deleted styles causing potential rendering issues
 * 
 * Actions:
 * 1. Find all projects with non-null styleIdEnhanced
 * 2. Cross-reference with existing styles collection
 * 3. Set styleIdEnhanced: null for orphaned references
 * 4. Application will fall back to global default style
 * 5. Generate report of affected projects
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface Project {
  _id: ObjectId;
  eventName: string;
  styleIdEnhanced?: ObjectId | null;
}

interface Style {
  _id: ObjectId;
  name?: string;
}

interface OrphanedReference {
  projectId: string;
  eventName: string;
  orphanedStyleId: string;
}

async function fixOrphanedStyleReferences(dryRun = false) {
  console.log('🔍 Fix Orphaned Style References Script');
  console.log('═'.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MODE (changes will be applied)'}\n`);

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);
    const projectsCollection = db.collection<Project>('projects');
    const stylesCollection = db.collection<Style>('styles');

    // Step 1: Get all existing style IDs
    console.log('📊 Step 1: Fetching existing styles...');
    const existingStyles = await stylesCollection.find({}).toArray();
    const existingStyleIds = new Set(existingStyles.map(s => s._id.toString()));
    console.log(`   Found ${existingStyles.length} existing styles\n`);

    // Step 2: Find all projects with styleIdEnhanced
    console.log('📊 Step 2: Fetching projects with styleIdEnhanced...');
    const projectsWithStyles = await projectsCollection.find({
      styleIdEnhanced: { $ne: null, $exists: true }
    }).toArray();
    console.log(`   Found ${projectsWithStyles.length} projects with styleIdEnhanced\n`);

    // Step 3: Identify orphaned references
    console.log('🔍 Step 3: Identifying orphaned references...');
    const orphanedReferences: OrphanedReference[] = [];
    
    for (const project of projectsWithStyles) {
      const styleId = project.styleIdEnhanced?.toString();
      if (styleId && !existingStyleIds.has(styleId)) {
        orphanedReferences.push({
          projectId: project._id.toString(),
          eventName: project.eventName,
          orphanedStyleId: styleId
        });
      }
    }

    console.log(`   Found ${orphanedReferences.length} orphaned references\n`);

    if (orphanedReferences.length === 0) {
      console.log('✅ No orphaned references found. Database is clean!\n');
      await generateReport([], existingStyles.length, projectsWithStyles.length);
      return;
    }

    // Step 4: Display affected projects
    console.log('⚠️  Step 4: Affected Projects:');
    console.log('─'.repeat(60));
    orphanedReferences.forEach((ref, index) => {
      console.log(`${index + 1}. ${ref.eventName}`);
      console.log(`   Project ID: ${ref.projectId}`);
      console.log(`   Orphaned Style ID: ${ref.orphanedStyleId}`);
      console.log();
    });

    // Step 5: Fix orphaned references
    if (!dryRun) {
      console.log('🔧 Step 5: Fixing orphaned references...');
      const projectIds = orphanedReferences.map(ref => new ObjectId(ref.projectId));
      
      const result = await projectsCollection.updateMany(
        { _id: { $in: projectIds } },
        { 
          $set: { styleIdEnhanced: null },
          $currentDate: { updatedAt: true }
        }
      );

      console.log(`   ✅ Updated ${result.modifiedCount} projects\n`);
    } else {
      console.log('📝 Step 5: DRY RUN - No changes made\n');
    }

    // Step 6: Generate report
    await generateReport(orphanedReferences, existingStyles.length, projectsWithStyles.length, dryRun);

    console.log('═'.repeat(60));
    console.log('✅ Script completed successfully\n');

    if (!dryRun) {
      console.log('⚡ Next Steps:');
      console.log('1. Verify affected projects render correctly with default styles');
      console.log('2. Review ORPHANED_STYLES_REPORT.md for details');
      console.log('3. Notify admin of affected projects (if necessary)\n');
    } else {
      console.log('💡 To apply changes, run again without --dry-run flag\n');
    }

  } catch (error) {
    console.error('❌ Error during script execution:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function generateReport(
  orphanedReferences: OrphanedReference[],
  totalStyles: number,
  projectsWithStyles: number,
  dryRun = false
) {
  console.log('📄 Step 6: Generating report...');
  
  const timestamp = new Date().toISOString();
  const report = `# Orphaned Style References Report

**Generated:** ${timestamp}  
**Mode:** ${dryRun ? 'Dry Run' : 'Live Execution'}

## Summary

- **Total Existing Styles:** ${totalStyles}
- **Projects with styleIdEnhanced:** ${projectsWithStyles}
- **Orphaned References Found:** ${orphanedReferences.length}
- **Status:** ${orphanedReferences.length === 0 ? '✅ Database Clean' : dryRun ? '⚠️  Issues Found (Not Fixed - Dry Run)' : '✅ Issues Fixed'}

## Overview

This report identifies projects that reference deleted or non-existent \`styleIdEnhanced\` values.

When a project has an orphaned style reference:
- The application falls back to the global default style
- No visual breakage occurs, but the intended custom styling is lost
- Setting \`styleIdEnhanced: null\` makes the fallback behavior explicit

## Affected Projects

${orphanedReferences.length === 0 ? 'None - all style references are valid.\n' : ''}${orphanedReferences.map((ref, index) => `
### ${index + 1}. ${ref.eventName}

- **Project ID:** \`${ref.projectId}\`
- **Orphaned Style ID:** \`${ref.orphanedStyleId}\`
- **Action Taken:** ${dryRun ? 'None (dry run)' : 'Set styleIdEnhanced to null'}
- **Result:** ${dryRun ? 'Would fall back to default style' : 'Now explicitly uses default style'}
`).join('\n')}

## Technical Details

### Database Changes${dryRun ? ' (Proposed)' : ' (Applied)'}

\`\`\`javascript
// MongoDB update operation${dryRun ? ' (not executed)' : ''}
db.projects.updateMany(
  { _id: { $in: [${orphanedReferences.map(r => `ObjectId("${r.projectId}")`).join(', ')}] } },
  { 
    $set: { styleIdEnhanced: null },
    $currentDate: { updatedAt: true }
  }
)
\`\`\`

### Style Fallback Behavior

When \`styleIdEnhanced\` is \`null\`:
1. Application checks for project-specific style (none found)
2. Falls back to global default style from \`styles\` collection
3. Rendering continues without errors
4. User may notice different visual styling from original

## Recommendations

${orphanedReferences.length === 0 ? `
✅ No action required - all style references are valid.
` : `
1. **Review Affected Projects:** Verify that default styling is acceptable for these events
2. **Reapply Custom Styles (if needed):** Use the Admin UI to assign new custom styles
3. **Style Cleanup:** Consider removing unused styles from the database
4. **Prevent Future Orphaning:** Before deleting a style, reassign all projects using it
`}

## Prevention Strategy

To avoid orphaned references in the future:

1. **Before deleting a style:**
   - Query for projects using the style: \`db.projects.find({ styleIdEnhanced: styleId })\`
   - Reassign those projects to a different style or set to \`null\`

2. **Add referential integrity:**
   - Consider adding a pre-delete hook in the Admin UI
   - Warn admins when attempting to delete a style that's in use

3. **Regular audits:**
   - Run this script periodically (monthly) to catch orphaned references early
   - Add to maintenance checklist

---

*Generated by: \`scripts/fixOrphanedStyleReferences.ts\`*  
*Database: ${MONGODB_DB}*  
*Timestamp: ${timestamp}*
`;

  const reportPath = path.join(process.cwd(), 'ORPHANED_STYLES_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`   ✅ Report saved to: ${reportPath}\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Execute script
fixOrphanedStyleReferences(dryRun).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
