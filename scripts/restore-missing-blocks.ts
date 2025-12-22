// scripts/restore-missing-blocks.ts
// WHAT: Restore missing data blocks to fix template resolution
// WHY: Default Event/Partner templates reference blocks that don't exist
// HOW: Identify missing blocks, create them with sensible defaults from working templates

import { getDb } from '../lib/db';
import { ObjectId } from 'mongodb';

// WHAT: IDs of blocks that templates reference but don't exist
// WHY: Extracted from diagnostic output (Default Event/Partner Report templates)
const REQUIRED_BLOCK_IDS = [
  '69034a7a95fa6ce8520f37dc',
  '69023cedfa020c8d5318a29d',
  '6904790f4aad3c506416a0b7',
  '69047b814aad3c506416a0b8',
  '68bc680773eff5a9fd73df05',
  '6903d7d69ab67b6c5ba48d04',
  '6903d7059ab67b6c5ba48d03',
  '69037a4853813a93b1809be0',
  '69036c6af7daf64629cb6b84',
  '6903c78d340f78b5a6742bd0',
  '69036f35603a88659c08014b'
];

interface DataBlock {
  _id?: ObjectId;
  name: string;
  showTitle: boolean;
  isActive: boolean;
  order: number;
  charts: Array<{
    chartId: string;
    width: number;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

async function checkExistingBlocks() {
  console.log('\n🔍 Checking which blocks exist...\n');
  
  const db = await getDb();
  const dataBlocksCollection = db.collection('data_blocks');
  
  const existingBlocks = await dataBlocksCollection
    .find({ _id: { $in: REQUIRED_BLOCK_IDS.map(id => new ObjectId(id)) } })
    .toArray();
  
  const existingIds = new Set(existingBlocks.map(b => b._id.toString()));
  const missingIds = REQUIRED_BLOCK_IDS.filter(id => !existingIds.has(id));
  
  console.log(`✅ Found ${existingBlocks.length} existing blocks`);
  console.log(`❌ Missing ${missingIds.length} blocks\n`);
  
  if (missingIds.length > 0) {
    console.log('Missing block IDs:');
    missingIds.forEach(id => console.log(`  - ${id}`));
    console.log('');
  }
  
  return { existingBlocks, missingIds };
}

async function findBlocksInBackups(missingIds: string[]) {
  console.log('\n📦 Searching backups for missing blocks...\n');
  
  const db = await getDb();
  
  // WHAT: Check all potential backup collections
  // WHY: Blocks might exist in old database snapshots
  const backupCollections = [
    'data_blocks_backup',
    'data_blocks_old',
    'visualization_blocks_backup'
  ];
  
  const foundInBackups: any[] = [];
  
  for (const collectionName of backupCollections) {
    try {
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) continue;
      
      const backupCollection = db.collection(collectionName);
      const blocks = await backupCollection
        .find({ _id: { $in: missingIds.map(id => new ObjectId(id)) } })
        .toArray();
      
      if (blocks.length > 0) {
        console.log(`✅ Found ${blocks.length} block(s) in ${collectionName}`);
        foundInBackups.push(...blocks);
      }
    } catch (error) {
      // Collection doesn't exist, skip
    }
  }
  
  if (foundInBackups.length === 0) {
    console.log('⚠️  No blocks found in backups\n');
  }
  
  return foundInBackups;
}

async function createDefaultBlocks(missingIds: string[]) {
  console.log('\n🏗️  Creating missing blocks with sensible defaults...\n');
  
  const db = await getDb();
  const dataBlocksCollection = db.collection('data_blocks');
  const chartConfigsCollection = db.collection('chart_configurations');
  
  // WHAT: Get all available charts for reference
  // WHY: Need to know which charts exist to create valid blocks
  const availableCharts = await chartConfigsCollection
    .find({ isActive: true })
    .project({ chartId: 1, title: 1, type: 1 })
    .toArray();
  
  console.log(`Found ${availableCharts.length} available charts\n`);
  
  // WHAT: Define default block templates based on common patterns
  // WHY: Provide sensible defaults that work for most reports
  const defaultBlockTemplates = [
    {
      name: 'Overview',
      chartTypes: ['kpi', 'kpi', 'kpi'],
      description: 'Key performance indicators'
    },
    {
      name: 'Fan Metrics',
      chartTypes: ['pie', 'bar'],
      description: 'Fan demographics and engagement'
    },
    {
      name: 'Merchandise',
      chartTypes: ['pie', 'bar'],
      description: 'Merchandise sales and penetration'
    },
    {
      name: 'Event Details',
      chartTypes: ['text', 'image'],
      description: 'Event information and imagery'
    },
    {
      name: 'Ad Value',
      chartTypes: ['kpi', 'bar'],
      description: 'Advertising value metrics'
    }
  ];
  
  const blocksToCreate: DataBlock[] = [];
  const now = new Date().toISOString();
  
  for (let i = 0; i < missingIds.length && i < defaultBlockTemplates.length; i++) {
    const blockId = missingIds[i];
    const template = defaultBlockTemplates[i];
    
    // WHAT: Find charts matching the desired types
    // WHY: Create blocks with actual available charts
    const charts = [];
    for (let j = 0; j < template.chartTypes.length; j++) {
      const desiredType = template.chartTypes[j];
      const chart = availableCharts.find(c => 
        c.type === desiredType && !charts.some(existing => existing.chartId === c.chartId)
      );
      
      if (chart) {
        charts.push({
          chartId: chart.chartId,
          width: desiredType === 'kpi' ? 1 : 2, // KPIs are narrow, others are wider
          order: j
        });
      }
    }
    
    const block: DataBlock = {
      _id: new ObjectId(blockId),
      name: template.name,
      showTitle: true,
      isActive: true,
      order: i,
      charts: charts,
      createdAt: now,
      updatedAt: now
    };
    
    blocksToCreate.push(block);
    
    console.log(`📝 Prepared block: "${block.name}" with ${charts.length} chart(s)`);
  }
  
  // WHAT: Handle remaining missing blocks if more than templates
  // WHY: Ensure all missing blocks are created
  if (missingIds.length > defaultBlockTemplates.length) {
    for (let i = defaultBlockTemplates.length; i < missingIds.length; i++) {
      const blockId = missingIds[i];
      
      // WHAT: Create minimal empty block
      // WHY: Better to have empty block than missing reference
      const block: DataBlock = {
        _id: new ObjectId(blockId),
        name: `Additional Block ${i + 1}`,
        showTitle: true,
        isActive: true,
        order: i,
        charts: [],
        createdAt: now,
        updatedAt: now
      };
      
      blocksToCreate.push(block);
      console.log(`📝 Prepared empty block: "${block.name}"`);
    }
  }
  
  return blocksToCreate;
}

async function restoreBlocks(blocksToRestore: any[]) {
  console.log(`\n💾 Restoring ${blocksToRestore.length} block(s) to database...\n`);
  
  const db = await getDb();
  const dataBlocksCollection = db.collection('data_blocks');
  
  let restoredCount = 0;
  let errorCount = 0;
  
  for (const block of blocksToRestore) {
    try {
      // WHAT: Ensure _id is ObjectId
      // WHY: MongoDB requires proper type
      if (!(block._id instanceof ObjectId)) {
        block._id = new ObjectId(block._id);
      }
      
      // WHAT: Insert block (update if exists, but shouldn't)
      // WHY: Safe upsert pattern
      await dataBlocksCollection.updateOne(
        { _id: block._id },
        { $set: block },
        { upsert: true }
      );
      
      console.log(`✅ Restored: ${block.name} (${block._id.toString()})`);
      restoredCount++;
    } catch (error) {
      console.error(`❌ Failed to restore ${block.name}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n✅ Successfully restored ${restoredCount} block(s)`);
  if (errorCount > 0) {
    console.log(`❌ Failed to restore ${errorCount} block(s)`);
  }
  
  return { restoredCount, errorCount };
}

async function verifyFix() {
  console.log('\n🔍 Verifying fix...\n');
  
  const db = await getDb();
  const dataBlocksCollection = db.collection('data_blocks');
  
  const allBlocks = await dataBlocksCollection
    .find({ _id: { $in: REQUIRED_BLOCK_IDS.map(id => new ObjectId(id)) } })
    .toArray();
  
  const foundCount = allBlocks.length;
  const requiredCount = REQUIRED_BLOCK_IDS.length;
  
  if (foundCount === requiredCount) {
    console.log(`✅ SUCCESS: All ${requiredCount} required blocks now exist!\n`);
    return true;
  } else {
    console.log(`⚠️  PARTIAL: ${foundCount} of ${requiredCount} blocks exist\n`);
    return false;
  }
}

async function main() {
  console.log('🔧 RESTORE MISSING DATA BLOCKS');
  console.log('==============================\n');
  console.log('This script will restore missing data blocks referenced by templates\n');
  
  try {
    // Step 1: Check what's missing
    const { existingBlocks, missingIds } = await checkExistingBlocks();
    
    if (missingIds.length === 0) {
      console.log('🎉 No missing blocks - everything is fine!\n');
      process.exit(0);
    }
    
    // Step 2: Try to find blocks in backups
    const blocksFromBackups = await findBlocksInBackups(missingIds);
    
    // Step 3: Create blocks for IDs not found in backups
    const idsStillMissing = missingIds.filter(id => 
      !blocksFromBackups.some(b => b._id.toString() === id)
    );
    
    let blocksToCreate: any[] = [];
    if (idsStillMissing.length > 0) {
      blocksToCreate = await createDefaultBlocks(idsStillMissing);
    }
    
    // Step 4: Restore all blocks
    const allBlocksToRestore = [...blocksFromBackups, ...blocksToCreate];
    
    if (allBlocksToRestore.length === 0) {
      console.log('⚠️  No blocks to restore\n');
      process.exit(1);
    }
    
    const { restoredCount, errorCount } = await restoreBlocks(allBlocksToRestore);
    
    // Step 5: Verify the fix
    const success = await verifyFix();
    
    if (success) {
      console.log('🎉 All missing blocks have been restored!');
      console.log('💡 Run "npm run diagnose:reports" to verify templates now work\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some blocks are still missing. Manual intervention may be needed.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as restoreMissingBlocks };
