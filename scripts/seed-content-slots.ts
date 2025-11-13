// WHAT: Pre-seed reportImage and reportText chart configurations
// WHY: Template builders need minimum 10 slots for each content type
// HOW: Create 15 slots each (1-15) to provide buffer

import { MongoClient } from 'mongodb';

async function seedContentSlots() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');
    const chartsCollection = db.collection('chart_configurations');

    const timestamp = new Date().toISOString();

    // Pre-seed 15 reportImage slots
    console.log('Creating 15 reportImage chart configurations...\n');
    for (let i = 1; i <= 15; i++) {
      const chartId = `report-image-${i}`;
      
      // Check if already exists
      const existing = await chartsCollection.findOne({ chartId });
      if (existing) {
        console.log(`✓ ${chartId} already exists`);
        continue;
      }

      await chartsCollection.insertOne({
        chartId,
        name: `Report Image ${i}`,
        type: 'image',
        formula: `stats.reportImage${i}`,
        icon: 'image',
        aspectRatio: '16:9', // Default landscape
        description: `Image slot ${i} for report content`,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      console.log(`✅ Created ${chartId}`);
    }

    // Pre-seed 15 reportText slots
    console.log('\nCreating 15 reportText chart configurations...\n');
    for (let i = 1; i <= 15; i++) {
      const chartId = `report-text-${i}`;
      
      // Check if already exists
      const existing = await chartsCollection.findOne({ chartId });
      if (existing) {
        console.log(`✓ ${chartId} already exists`);
        continue;
      }

      await chartsCollection.insertOne({
        chartId,
        name: `Report Text ${i}`,
        type: 'text',
        formula: `stats.reportText${i}`,
        icon: 'article',
        description: `Text slot ${i} for report content`,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      console.log(`✅ Created ${chartId}`);
    }

    console.log('\n✅ Content slots seeding complete!');
    console.log('Total: 15 image slots + 15 text slots = 30 slots');

  } finally {
    await client.close();
  }
}

seedContentSlots();
