// Verify viewSlug exists for partners
import clientPromise from '../lib/mongodb';
import config from '../lib/config';

async function verify() {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  
  // Get first 5 partners
  const partners = await db.collection('partners')
    .find({})
    .limit(5)
    .project({ name: 1, viewSlug: 1 })
    .toArray();
  
  console.log('Sample partners:');
  partners.forEach(p => {
    console.log(`  ${p.name}: viewSlug = ${p.viewSlug || 'MISSING'}`);
  });
  
  // Count partners without viewSlug
  const missingCount = await db.collection('partners').countDocuments({
    $or: [
      { viewSlug: { $exists: false } },
      { viewSlug: null },
      { viewSlug: '' }
    ]
  });
  
  console.log(`\nPartners missing viewSlug: ${missingCount}`);
  process.exit(0);
}

verify().catch(console.error);
