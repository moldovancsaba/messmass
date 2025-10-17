// scripts/backup-all-charts.js
// CRITICAL: Backup all charts before deletion
// WHY: Enable rollback if rebuild fails

const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function backupCharts() {
  let client;
  try {
    console.log('🔗 Connecting to MongoDB Atlas...\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('messmass');
    const col = db.collection('chartConfigurations');

    // Get all charts
    const charts = await col.find({}).toArray();
    
    console.log(`📊 Found ${charts.length} charts in production\n`);
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      source: 'MongoDB Atlas messmass.chartConfigurations',
      totalCharts: charts.length,
      charts: charts
    };
    
    // Save to file with timestamp
    const filename = `scripts/backups/charts-backup-${Date.now()}.json`;
    
    // Ensure backups directory exists
    if (!fs.existsSync('scripts/backups')) {
      fs.mkdirSync('scripts/backups', { recursive: true });
    }
    
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log('═══════════════════════════════════════════════');
    console.log('✅ BACKUP COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`📁 File: ${filename}`);
    console.log(`📊 Charts backed up: ${charts.length}`);
    console.log(`⏰ Timestamp: ${backup.timestamp}`);
    console.log('═══════════════════════════════════════════════\n');
    
    // Show what will be deleted
    console.log('⚠️  CHARTS THAT WILL BE DELETED:\n');
    charts.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.chartId} - ${c.title} (${c.type}, order: ${c.order})`);
    });
    
    console.log('\n💾 Backup saved successfully.');
    console.log('📌 Keep this file to restore charts if needed.\n');

  } catch (err) {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

backupCharts();
