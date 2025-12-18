// WHAT: Debug script to check report styleId fields
// WHY: Verify if reports have styleId to apply custom styling
// HOW: Connect to MongoDB and inspect reports collection

import clientPromise from '../lib/mongodb';
import config from '../lib/config';

async function debugReportStyles() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log('🔍 Checking reports for styleId...\n');

    // Check partner reports
    const partnerReports = await db
      .collection('reports')
      .find({ type: 'partner' })
      .toArray();

    console.log('📊 Partner Reports:');
    partnerReports.forEach(report => {
      console.log(`  - ${report.name}`);
      console.log(`    ID: ${report._id}`);
      console.log(`    styleId: ${report.styleId || 'NOT SET'}`);
      console.log(`    type: ${report.type}`);
      console.log('');
    });

    // Check event reports
    const eventReports = await db
      .collection('reports')
      .find({ type: 'event' })
      .toArray();

    console.log('📊 Event Reports:');
    eventReports.forEach(report => {
      console.log(`  - ${report.name}`);
      console.log(`    ID: ${report._id}`);
      console.log(`    styleId: ${report.styleId || 'NOT SET'}`);
      console.log(`    type: ${report.type}`);
      console.log('');
    });

    // Check available styles
    const styles = await db
      .collection('page_styles_enhanced')
      .find({})
      .toArray();

    console.log('🎨 Available Styles:');
    styles.forEach(style => {
      console.log(`  - ${style.name}`);
      console.log(`    ID: ${style._id}`);
      console.log(`    isGlobalDefault: ${style.isGlobalDefault}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugReportStyles();
