import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { ObjectId } from 'mongodb';

async function checkTemplateBlocks() {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  
  const templateId = new ObjectId('691323a22c601d6a41780983');
  const template = await db.collection('report_templates').findOne({ _id: templateId });
  
  console.log('📄 Template:', template?.name);
  console.log('📦 Blocks:', template?.dataBlocks?.length);
  
  if (template?.dataBlocks) {
    console.log('\n🔍 Block details:');
    for (const ref of template.dataBlocks) {
      const block = await db.collection('data_blocks').findOne({ _id: ref.blockId });
      console.log(`\n  Block: ${block?.name}`);
      console.log(`  Charts in block: ${block?.charts?.length}`);
      if (block?.charts) {
        for (const chart of block.charts) {
          console.log(`    - ${chart.chartId}`);
        }
      }
    }
  }
  
  process.exit(0);
}

checkTemplateBlocks();
