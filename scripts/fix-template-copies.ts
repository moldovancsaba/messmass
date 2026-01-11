#!/usr/bin/env node

/**
 * Fix Template Copies - Create Independent Blocks
 * 
 * WHAT: Migrate existing template copies to have independent blocks
 * WHY: Old copy function created aliases (shared blocks), new function creates independent copies
 * HOW: For each template copy, duplicate its blocks and update references
 * 
 * Usage: npx tsx scripts/fix-template-copies.ts [--dry-run]
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { resolve } from 'path';

// WHAT: Load environment variables from .env.local
// WHY: Scripts run outside Next.js context, need to load env vars manually
config({ path: resolve(process.cwd(), '.env.local') });

// WHAT: Get MongoDB connection from environment variables
// WHY: Scripts run outside Next.js context, need direct env access
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('   Set it in .env.local or export it before running the script');
  process.exit(1);
}

interface DataBlockReference {
  blockId: ObjectId | string;
  order: number;
}

interface ReportTemplate {
  _id: ObjectId;
  name: string;
  type: 'event' | 'partner' | 'global';
  dataBlocks: DataBlockReference[];
  [key: string]: any;
}

interface DataBlock {
  _id: ObjectId;
  name: string;
  charts: Array<{ chartId: string; width: number; order: number }>;
  order: number;
  isActive: boolean;
  showTitle?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

async function fixTemplateCopies(dryRun: boolean = false) {
  console.log('🔧 Fixing Template Copies - Creating Independent Blocks\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will modify database)'}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const templatesCollection = db.collection('report_templates');
    const blocksCollection = db.collection('data_blocks');

    // WHAT: Find all templates that are likely copies (name starts with "Copy of")
    // WHY: Identify templates that were created with the old buggy copy function
    const copyTemplates = await templatesCollection
      .find({ name: { $regex: /^Copy of /i } })
      .toArray();

    console.log(`Found ${copyTemplates.length} potential template copies\n`);

    if (copyTemplates.length === 0) {
      console.log('✅ No template copies found. Nothing to fix.');
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const template of copyTemplates) {
      const templateId = template._id.toString();
      const templateName = template.name;

      console.log(`\n📋 Processing: ${templateName} (${templateId})`);

      // WHAT: Check if template has blocks
      // WHY: Skip templates without blocks
      if (!template.dataBlocks || template.dataBlocks.length === 0) {
        console.log('  ⏭️  Skipping: No blocks to copy');
        skippedCount++;
        continue;
      }

      // WHAT: Get all block IDs referenced by this template
      // WHY: Need to fetch full block data to create copies
      const blockIds = template.dataBlocks.map((ref: DataBlockReference) => {
        if (typeof ref.blockId === 'string' && ObjectId.isValid(ref.blockId)) {
          return new ObjectId(ref.blockId);
        }
        return ref.blockId;
      });

      // WHAT: Fetch all blocks referenced by this template
      // WHY: Need block content (name, charts, etc.) to create independent copies
      const originalBlocks = await blocksCollection
        .find({ _id: { $in: blockIds } })
        .toArray();

      if (originalBlocks.length === 0) {
        console.log('  ⚠️  Warning: Template references blocks that no longer exist');
        skippedCount++;
        continue;
      }

      console.log(`  📦 Found ${originalBlocks.length} blocks to duplicate`);

      // WHAT: Check if blocks are shared with other templates
      // WHY: Only fix if blocks are actually shared (not already independent)
      const blockIdStrings = blockIds.map(id => id.toString());
      const otherTemplates = await templatesCollection
        .find({
          _id: { $ne: template._id },
          'dataBlocks.blockId': { $in: blockIdStrings }
        })
        .toArray();

      if (otherTemplates.length === 0) {
        console.log('  ✅ Blocks are already independent (not shared with other templates)');
        skippedCount++;
        continue;
      }

      console.log(`  🔗 Blocks are shared with ${otherTemplates.length} other template(s)`);

      if (dryRun) {
        console.log('  🔍 DRY RUN: Would create new blocks and update template references');
        fixedCount++;
        continue;
      }

      // WHAT: Create new copies of each block
      // WHY: New template needs independent blocks, not references to original blocks
      const newBlockRefs: DataBlockReference[] = [];
      const now = new Date().toISOString();

      for (const originalBlock of originalBlocks) {
        // WHAT: Find original order in template
        // WHY: Preserve block order from original template
        const originalRef = template.dataBlocks.find((ref: DataBlockReference) => {
          const refId = typeof ref.blockId === 'string' ? ref.blockId : ref.blockId.toString();
          const blockId = originalBlock._id.toString();
          return refId === blockId;
        });

        // WHAT: Create new block with same content but new ID
        // WHY: Each template copy must have its own independent blocks
        const newBlock: Omit<DataBlock, '_id'> = {
          name: originalBlock.name,
          charts: originalBlock.charts || [],
          order: originalBlock.order || 0,
          isActive: originalBlock.isActive !== false,
          showTitle: originalBlock.showTitle !== false,
          createdAt: now,
          updatedAt: now
        };

        const insertResult = await blocksCollection.insertOne(newBlock as any);
        const newBlockId = insertResult.insertedId;

        newBlockRefs.push({
          blockId: newBlockId,
          order: originalRef?.order ?? newBlockRefs.length
        });

        console.log(`  ✅ Created new block: ${originalBlock.name} (${newBlockId.toString()})`);
      }

      // WHAT: Sort by original order to maintain template structure
      // WHY: Preserve the visual layout of the original template
      newBlockRefs.sort((a, b) => a.order - b.order);

      // WHAT: Update template with new block references
      // WHY: Template should now point to new independent blocks
      await templatesCollection.updateOne(
        { _id: template._id },
        {
          $set: {
            dataBlocks: newBlockRefs,
            updatedAt: now
          }
        }
      );

      console.log(`  ✅ Updated template with ${newBlockRefs.length} independent blocks`);
      fixedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`  ✅ Fixed: ${fixedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration complete!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// WHAT: Parse command line arguments
// WHY: Allow dry-run mode for safety
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

fixTemplateCopies(dryRun)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

